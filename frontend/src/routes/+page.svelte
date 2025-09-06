<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { CommentApi } from '$lib/services/CommentApi';
  import { CommentSseManager } from '$lib/services/CommentSseManager';
  import { resetAllStores, connectionStore } from '$lib/stores/commentStore';
  import CommentForm from '$lib/components/CommentForm.svelte';
  import CommentList from '$lib/components/CommentList.svelte';
  import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
  import type { CommentResponse, ApiError } from '$lib/types/comment';
  import type { SseConnectionState } from '$lib/types/sse';
  
  // Configuration
  const API_BASE_URL = 'http://localhost:8080';
  
  // Services
  let commentApi: CommentApi;
  let sseManager: CommentSseManager;
  
  // State
  let isConnecting = $state(false);
  let lastError = $state<string | null>(null);
  let connectionState = $state<SseConnectionState>('disconnected');
  
  // Initialize services
  onMount(() => {
    console.log('Live streaming page: Initializing services');
    
    // Initialize services
    commentApi = new CommentApi(API_BASE_URL);
    sseManager = new CommentSseManager(API_BASE_URL);
    
    // Subscribe to connection state
    const unsubscribeConnection = connectionStore.subscribe(state => {
      connectionState = state;
    });
    
    // Start SSE connection
    handleConnect();
    
    // Cleanup on page unload
    const handleBeforeUnload = () => {
      sseManager?.disconnect();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsubscribeConnection();
    };
  });
  
  onDestroy(() => {
    console.log('Live streaming page: Cleaning up');
    sseManager?.destroy();
  });
  
  // Handle SSE connection
  function handleConnect() {
    isConnecting = true;
    lastError = null;
    
    try {
      sseManager.connect();
      console.log('Live streaming page: SSE connection started');
    } catch (error) {
      console.error('Live streaming page: Failed to start SSE connection', error);
      lastError = 'SSE接続の開始に失敗しました';
    } finally {
      isConnecting = false;
    }
  }
  
  // Handle manual reconnection
  function handleReconnect() {
    console.log('Live streaming page: Manual reconnection triggered');
    lastError = null;
    sseManager.reconnect();
  }
  
  // Handle comment submission success
  function handleCommentSuccess(response: CommentResponse) {
    console.log('Live streaming page: Comment posted successfully', response);
    lastError = null;
  }
  
  // Handle comment submission error
  function handleCommentError(error: ApiError) {
    console.error('Live streaming page: Comment post failed', error);
    lastError = error.message;
  }
  
  // Handle development reset
  function handleReset() {
    console.log('Live streaming page: Resetting application state');
    sseManager.resetAll();
    lastError = null;
  }
</script>

<svelte:head>
  <title>SSE学習 - ライブ配信</title>
  <meta name="description" content="Server-Sent Eventsを使用したリアルタイムコメント機能のライブ配信画面">
</svelte:head>

<div class="live-streaming-page">
  <!-- Header -->
  <header class="page-header">
    <div class="header-content">
      <h1 class="page-title">🎥 SSE学習 - ライブ配信</h1>
      <p class="page-subtitle">
        Server-Sent Eventsによるリアルタイムコメント配信システム
      </p>
    </div>
    
    <!-- Development controls -->
    <div class="dev-controls">
      <button class="dev-button" onclick={handleReset} title="アプリケーション状態をリセット">
        🔄 リセット
      </button>
    </div>
  </header>
  
  <!-- Main content -->
  <main class="main-content">
    <!-- Video area -->
    <section class="video-section" aria-label="配信動画">
      <div class="video-container">
        <div class="video-placeholder">
          <div class="video-icon" aria-hidden="true">📺</div>
          <h2 class="video-title">ライブ配信</h2>
          <p class="video-description">
            SSE学習用のモック配信画面です<br>
            右側のコメント欄でリアルタイム通信をテストできます
          </p>
          <div class="video-stats">
            <span class="stat">🔴 LIVE</span>
            <span class="stat">👥 視聴者: 1</span>
            <span class="stat">⏱️ 配信時間: 00:05:42</span>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Comments sidebar -->
    <aside class="comments-section" aria-label="コメント欄">
      <div class="comments-container">
        <!-- Connection status (only show when not connected) -->
        {#if connectionState !== 'connected'}
          <div class="status-section">
            <ConnectionStatus 
              onReconnectClick={handleReconnect}
              showStats={false}
              compact={true}
            />
          </div>
        {/if}
        
        <!-- Error display -->
        {#if lastError}
          <div class="error-banner" role="alert">
            <span class="error-icon">⚠️</span>
            <span class="error-text">{lastError}</span>
            <button class="error-close" onclick={() => lastError = null} aria-label="エラーを閉じる">
              ✕
            </button>
          </div>
        {/if}
        
        <!-- Comment form -->
        <div class="form-section">
          <CommentForm
            baseUrl={API_BASE_URL}
            disabled={isConnecting}
            onSuccess={handleCommentSuccess}
            onError={handleCommentError}
          />
        </div>
        
        <!-- Comment list -->
        <div class="list-section">
          <CommentList
            autoScroll={true}
            maxHeight="400px"
            showEmptyState={true}
            newCommentHighlightDuration={3000}
          />
        </div>
      </div>
    </aside>
  </main>
  
  <!-- Footer -->
  <footer class="page-footer">
    <div class="footer-content">
      <p class="footer-text">
        <strong>技術スタック:</strong> 
        SvelteKit 5 + TypeScript + TailwindCSS + Spring Boot + SSE
      </p>
      <p class="footer-links">
        <a href="https://github.com/Shion-Serizawa/sse_learn" target="_blank" rel="noopener">
          📁 GitHub Repository
        </a>
        <span class="separator">|</span>
        <a href="https://docs.anthropic.com/claude-code" target="_blank" rel="noopener">
          🤖 Claude Code
        </a>
      </p>
    </div>
  </footer>
</div>

<style>
  .live-streaming-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* Header */
  .page-header {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 1.5rem 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-content {
    flex: 1;
  }

  .page-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
    line-height: 1.2;
  }

  .page-subtitle {
    font-size: 1rem;
    color: #64748b;
    margin: 0;
  }

  .dev-controls {
    display: flex;
    gap: 0.75rem;
  }

  .dev-button {
    padding: 0.5rem 1rem;
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dev-button:hover {
    background: #e2e8f0;
    border-color: #94a3b8;
  }

  /* Main content */
  .main-content {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 1.5rem;
    padding: 1.5rem 2rem;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
  }

  /* Video section */
  .video-section {
    display: flex;
    flex-direction: column;
  }

  .video-container {
    flex: 1;
    background: #000;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .video-placeholder {
    width: 100%;
    height: 100%;
    min-height: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    color: white;
    text-align: center;
    padding: 3rem;
  }

  .video-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    opacity: 0.8;
  }

  .video-title {
    font-size: 2.25rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    color: #f8fafc;
  }

  .video-description {
    font-size: 1.125rem;
    line-height: 1.6;
    color: #cbd5e1;
    margin: 0 0 2rem 0;
    max-width: 500px;
  }

  .video-stats {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .stat {
    font-size: 0.875rem;
    font-weight: 600;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .stat:first-child {
    color: #ef4444;
  }

  /* Comments section */
  .comments-section {
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    max-height: calc(100vh - 200px);
    min-height: 600px;
  }

  .comments-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .status-section {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    flex-shrink: 0;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #fef2f2;
    border-bottom: 1px solid #fecaca;
    color: #dc2626;
    font-size: 0.875rem;
  }

  .error-icon {
    flex-shrink: 0;
  }

  .error-text {
    flex: 1;
  }

  .error-close {
    flex-shrink: 0;
    background: none;
    border: none;
    color: #dc2626;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .error-close:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .form-section {
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
  }

  .list-section {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  /* Footer */
  .page-footer {
    background: white;
    border-top: 1px solid #e2e8f0;
    padding: 1.5rem 2rem;
    margin-top: auto;
  }

  .footer-content {
    max-width: 1400px;
    margin: 0 auto;
    text-align: center;
  }

  .footer-text {
    font-size: 0.875rem;
    color: #64748b;
    margin: 0 0 0.5rem 0;
  }

  .footer-links {
    font-size: 0.875rem;
    margin: 0;
  }

  .footer-links a {
    color: #3b82f6;
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-links a:hover {
    color: #2563eb;
    text-decoration: underline;
  }

  .separator {
    margin: 0 1rem;
    color: #cbd5e1;
  }

  /* Tablet responsive */
  @media (max-width: 1024px) {
    .main-content {
      grid-template-columns: 1fr 350px;
      gap: 1rem;
      padding: 1rem;
    }

    .page-header {
      padding: 1rem;
    }

    .page-title {
      font-size: 1.5rem;
    }

    .video-placeholder {
      min-height: 400px;
      padding: 2rem;
    }

    .video-title {
      font-size: 1.875rem;
    }
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .main-content {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 1rem;
    }

    .page-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .page-title {
      font-size: 1.25rem;
    }

    .page-subtitle {
      font-size: 0.875rem;
    }

    .video-placeholder {
      min-height: 300px;
      padding: 1.5rem;
    }

    .video-icon {
      font-size: 3rem;
    }

    .video-title {
      font-size: 1.5rem;
    }

    .video-description {
      font-size: 1rem;
    }

    .video-stats {
      gap: 1rem;
    }

    .comments-section {
      max-height: 600px;
    }

    .page-footer {
      padding: 1rem;
    }

    .footer-content {
      text-align: left;
    }

    .footer-links {
      flex-direction: column;
      gap: 0.5rem;
    }

    .separator {
      display: none;
    }
  }

  /* Small mobile responsive */
  @media (max-width: 480px) {
    .main-content {
      padding: 0.75rem;
    }

    .page-header {
      padding: 0.75rem;
    }

    .video-placeholder {
      padding: 1rem;
      min-height: 250px;
    }

    .video-stats {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>