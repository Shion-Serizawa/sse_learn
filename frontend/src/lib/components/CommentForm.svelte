<script lang="ts">
  import { CommentApi } from '../services/CommentApi';
  import type { CommentRequest, ApiError } from '../types/comment';
  
  // Props
  interface Props {
    baseUrl?: string;
    disabled?: boolean;
    onSuccess?: (response: any) => void;
    onError?: (error: ApiError) => void;
  }
  
  let {
    baseUrl = 'http://localhost:8080',
    disabled = false,
    onSuccess,
    onError
  }: Props = $props();
  
  // State
  let username = $state('');
  let message = $state('');
  let isSubmitting = $state(false);
  let errors = $state<Record<string, string>>({});
  
  // Constants
  const MAX_USERNAME_LENGTH = 50;
  const MAX_MESSAGE_LENGTH = 500;
  
  // Create API instance
  const commentApi = new CommentApi(baseUrl);
  
  // Computed values
  const usernameCount = $derived(username.length);
  const messageCount = $derived(message.length);
  const canSubmit = $derived(
    username.trim().length > 0 && 
    message.trim().length > 0 && 
    username.length <= MAX_USERNAME_LENGTH && 
    message.length <= MAX_MESSAGE_LENGTH &&
    !isSubmitting &&
    !disabled
  );
  
  // Validation
  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};
    
    // Username validation
    if (!username.trim()) {
      newErrors.username = 'ユーザー名は必須です';
    } else if (username.length > MAX_USERNAME_LENGTH) {
      newErrors.username = `ユーザー名は${MAX_USERNAME_LENGTH}文字以内で入力してください`;
    }
    
    // Message validation
    if (!message.trim()) {
      newErrors.message = 'メッセージは必須です';
    } else if (message.length > MAX_MESSAGE_LENGTH) {
      newErrors.message = `メッセージは${MAX_MESSAGE_LENGTH}文字以内で入力してください`;
    }
    
    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }
  
  // Real-time validation
  function validateUsername() {
    if (errors.username) {
      if (username.trim() && username.length <= MAX_USERNAME_LENGTH) {
        const { username: _, ...rest } = errors;
        errors = rest;
      }
    }
  }
  
  function validateMessage() {
    if (errors.message) {
      if (message.trim() && message.length <= MAX_MESSAGE_LENGTH) {
        const { message: _, ...rest } = errors;
        errors = rest;
      }
    }
  }
  
  // Form submission
  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    if (!validateForm() || !canSubmit) {
      return;
    }
    
    isSubmitting = true;
    errors = {}; // Clear previous errors
    
    try {
      const request: CommentRequest = {
        username: username.trim(),
        message: message.trim()
      };
      
      console.log('CommentForm: Submitting comment', { username: request.username, messageLength: request.message.length });
      
      const result = await commentApi.postComment(request);
      
      if (result.success) {
        console.log('CommentForm: Comment posted successfully', result.data);
        
        // Clear form on success
        username = '';
        message = '';
        errors = {};
        
        // Call success callback
        onSuccess?.(result.data);
      } else {
        console.error('CommentForm: Comment post failed', result.error);
        
        // Handle server validation errors
        if (result.error.fieldErrors) {
          errors = result.error.fieldErrors;
        } else {
          // General error
          errors = { general: result.error.message };
        }
        
        // Call error callback
        onError?.(result.error);
      }
    } catch (error) {
      console.error('CommentForm: Unexpected error', error);
      errors = { general: '予期しないエラーが発生しました' };
    } finally {
      isSubmitting = false;
    }
  }
  
  // Clear specific error
  function clearError(field: string) {
    if (errors[field]) {
      const { [field]: _, ...rest } = errors;
      errors = rest;
    }
  }
</script>

<form class="comment-form" onsubmit={handleSubmit}>
  <!-- General error display -->
  {#if errors.general}
    <div class="error-message general-error" role="alert">
      {errors.general}
    </div>
  {/if}
  
  <!-- Username field -->
  <div class="form-group">
    <label for="username" class="form-label">
      ユーザー名
      <span class="required-mark">*</span>
    </label>
    <div class="input-wrapper">
      <input
        id="username"
        type="text"
        bind:value={username}
        oninput={validateUsername}
        onfocus={() => clearError('username')}
        placeholder="ユーザー名を入力してください"
        maxlength={MAX_USERNAME_LENGTH}
        class="form-input"
        class:error={errors.username}
        class:valid={username.trim() && !errors.username}
        disabled={isSubmitting || disabled}
        autocomplete="username"
        required
      />
      <div class="character-count" class:warning={usernameCount > MAX_USERNAME_LENGTH * 0.8}>
        {usernameCount}/{MAX_USERNAME_LENGTH}
      </div>
    </div>
    {#if errors.username}
      <div class="error-message field-error" role="alert">
        {errors.username}
      </div>
    {/if}
  </div>
  
  <!-- Message field -->
  <div class="form-group">
    <label for="message" class="form-label">
      メッセージ
      <span class="required-mark">*</span>
    </label>
    <div class="input-wrapper">
      <textarea
        id="message"
        bind:value={message}
        oninput={validateMessage}
        onfocus={() => clearError('message')}
        placeholder="コメントを入力してください..."
        maxlength={MAX_MESSAGE_LENGTH}
        class="form-textarea"
        class:error={errors.message}
        class:valid={message.trim() && !errors.message}
        disabled={isSubmitting || disabled}
        rows="3"
        required
      ></textarea>
      <div class="character-count" class:warning={messageCount > MAX_MESSAGE_LENGTH * 0.8}>
        {messageCount}/{MAX_MESSAGE_LENGTH}
      </div>
    </div>
    {#if errors.message}
      <div class="error-message field-error" role="alert">
        {errors.message}
      </div>
    {/if}
  </div>
  
  <!-- Submit button -->
  <div class="form-actions">
    <button
      type="submit"
      class="submit-button"
      class:loading={isSubmitting}
      disabled={!canSubmit}
    >
      {#if isSubmitting}
        <span class="loading-spinner"></span>
        送信中...
      {:else}
        コメント投稿
      {/if}
    </button>
  </div>
</form>

<style>
  .comment-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 100%;
    padding: 1rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-weight: 600;
    font-size: 0.875rem;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .required-mark {
    color: #ef4444;
    font-weight: bold;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .form-input,
  .form-textarea {
    padding: 0.75rem;
    border: 2px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    background: white;
  }

  .form-input:focus,
  .form-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-input.error,
  .form-textarea.error {
    border-color: #ef4444;
  }

  .form-input.error:focus,
  .form-textarea.error:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .form-input.valid,
  .form-textarea.valid {
    border-color: #10b981;
  }

  .form-input:disabled,
  .form-textarea:disabled {
    background-color: #f9fafb;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .form-textarea {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }

  .character-count {
    align-self: flex-end;
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .character-count.warning {
    color: #f59e0b;
    font-weight: 600;
  }

  .error-message {
    font-size: 0.75rem;
    color: #ef4444;
    margin-top: 0.25rem;
  }

  .general-error {
    padding: 0.75rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    font-weight: 500;
  }

  .field-error {
    margin-left: 0.25rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }

  .submit-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 120px;
  }

  .submit-button:hover:not(:disabled) {
    background-color: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .submit-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .submit-button:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .submit-button.loading {
    background-color: #6b7280;
  }

  .loading-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .comment-form {
      padding: 0.75rem;
    }

    .form-input,
    .form-textarea {
      padding: 0.625rem;
    }

    .submit-button {
      width: 100%;
    }
  }
</style>