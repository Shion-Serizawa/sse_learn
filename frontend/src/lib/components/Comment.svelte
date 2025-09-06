<script lang="ts">
  import type { Comment as CommentType } from '../types/comment';
  
  // Props
  interface Props {
    comment: CommentType;
    isNew?: boolean;
    showAnimation?: boolean;
  }
  
  let { comment, isNew = false, showAnimation = true }: Props = $props();
  
  // Format timestamp for display
  function formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 1) {
        return 'たった今';
      } else if (diffMins < 60) {
        return `${diffMins}分前`;
      } else if (diffHours < 24) {
        return `${diffHours}時間前`;
      } else if (diffDays < 7) {
        return `${diffDays}日前`;
      } else {
        // Show actual date for older comments
        return date.toLocaleDateString('ja-JP', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.warn('Failed to parse timestamp:', timestamp, error);
      return '不明';
    }
  }
  
  // Get full timestamp for tooltip
  function getFullTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return timestamp;
    }
  }
  
  // Format message text (handle line breaks)
  function formatMessage(message: string): string {
    return message.replace(/\n/g, '<br>');
  }
</script>

<article 
  class="comment" 
  class:comment-new={isNew && showAnimation}
  aria-label={`${comment.username}さんのコメント`}
>
  <div class="comment-header">
    <div class="comment-avatar">
      <span class="avatar-initial" aria-hidden="true">
        {comment.username.charAt(0).toUpperCase()}
      </span>
    </div>
    
    <div class="comment-meta">
      <span class="comment-username" title={`ユーザー: ${comment.username}`}>
        {comment.username}
      </span>
      <time 
        class="comment-timestamp" 
        datetime={comment.timestamp}
        title={getFullTimestamp(comment.timestamp)}
      >
        {formatTimestamp(comment.timestamp)}
      </time>
    </div>
    
    {#if isNew && showAnimation}
      <div class="new-badge" aria-label="新着コメント">
        NEW
      </div>
    {/if}
  </div>
  
  <div class="comment-body">
    <p class="comment-message">
      {@html formatMessage(comment.message)}
    </p>
  </div>
</article>

<style>
  .comment {
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    transition: all 0.3s ease;
    position: relative;
  }

  .comment:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .comment-new {
    animation: slideInRight 0.5s ease-out, highlightNew 3s ease-out;
    border-color: #3b82f6;
    background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes highlightNew {
    0% {
      border-color: #3b82f6;
      background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
    }
    100% {
      border-color: #e5e7eb;
      background: white;
    }
  }

  .comment-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .comment-avatar {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  }

  .avatar-initial {
    color: white;
    font-weight: 600;
    font-size: 1rem;
    line-height: 1;
  }

  .comment-meta {
    flex: 1;
    min-width: 0;
  }

  .comment-username {
    display: block;
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
    line-height: 1.2;
    word-break: break-word;
  }

  .comment-timestamp {
    display: block;
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.125rem;
    cursor: help;
  }

  .comment-timestamp:hover {
    color: #374151;
  }

  .new-badge {
    flex-shrink: 0;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    font-size: 0.625rem;
    font-weight: 700;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    line-height: 1;
    animation: pulse 2s infinite;
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  .comment-body {
    margin-left: 3.25rem; /* Align with avatar */
  }

  .comment-message {
    color: #374151;
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: pre-wrap;
  }

  /* Mobile responsive */
  @media (max-width: 640px) {
    .comment {
      padding: 0.5rem;
    }

    .comment-header {
      gap: 0.5rem;
    }

    .comment-avatar {
      width: 2rem;
      height: 2rem;
    }

    .avatar-initial {
      font-size: 0.875rem;
    }

    .comment-body {
      margin-left: 2.5rem;
    }

    .comment-username {
      font-size: 0.8125rem;
    }

    .comment-message {
      font-size: 0.8125rem;
    }

    .new-badge {
      font-size: 0.5625rem;
      padding: 0.1875rem 0.375rem;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .comment {
      border-width: 2px;
    }

    .comment-new {
      border-width: 2px;
      border-color: #1d4ed8;
    }

    .avatar-initial {
      font-weight: 700;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .comment-new {
      animation: none;
    }

    .new-badge {
      animation: none;
    }

    .comment {
      transition: none;
    }
  }
</style>