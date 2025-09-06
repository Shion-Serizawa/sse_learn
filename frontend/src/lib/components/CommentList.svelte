<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { commentStore } from '../stores/commentStore';
  import Comment from './Comment.svelte';
  import type { Comment as CommentType } from '../types/comment';
  
  // Props
  interface Props {
    autoScroll?: boolean;
    maxHeight?: string;
    showEmptyState?: boolean;
    newCommentHighlightDuration?: number;
  }
  
  let {
    autoScroll = true,
    maxHeight = '400px',
    showEmptyState = true,
    newCommentHighlightDuration = 3000
  }: Props = $props();
  
  // State
  let comments = $state<CommentType[]>([]);
  let listContainer: HTMLElement;
  let newCommentIds = $state<Set<string>>(new Set());
  let isScrolledToBottom = $state(true);
  let isScrolledFromTop = $state(false); // Track if scrolled away from top (>100px)
  let unsubscribe: (() => void) | null = null;
  
  // Subscribe to comment store
  onMount(() => {
    unsubscribe = commentStore.subscribe((storeComments) => {
      const previousCommentIds = new Set(comments.map(c => c.id));
      const newCommentsFromStore = storeComments.filter(c => !previousCommentIds.has(c.id));
      
      // Mark new comments for highlighting
      if (newCommentsFromStore.length > 0) {
        newCommentsFromStore.forEach(comment => {
          newCommentIds.add(comment.id);
          
          // Remove highlight after duration
          setTimeout(() => {
            newCommentIds.delete(comment.id);
            newCommentIds = new Set(newCommentIds); // Trigger reactivity
          }, newCommentHighlightDuration);
        });
        
        newCommentIds = new Set(newCommentIds); // Trigger reactivity
      }
      
      comments = storeComments;
      
      // Auto-scroll to top if enabled and new comments arrive (latest comments are at top)
      if (autoScroll && !isScrolledFromTop && newCommentsFromStore.length > 0) {
        requestAnimationFrame(() => {
          listContainer?.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    });
    
    // No initial scroll - keep at top to show latest comments
  });
  
  onDestroy(() => {
    unsubscribe?.();
  });
  
  // Scroll handling
  function scrollToBottom(smooth = true) {
    if (listContainer) {
      listContainer.scrollTo({
        top: listContainer.scrollHeight,
        behavior: smooth ? 'smooth' : 'instant'
      });
    }
  }
  
  function handleScroll() {
    if (!listContainer) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listContainer;
    const threshold = 50; // pixels from bottom
    isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - threshold;
    
    // Track if user scrolled away from top (show "最新へ" button when >100px from top)
    isScrolledFromTop = scrollTop > 100;
  }
  
  // Manual scroll to top (latest comments) button  
  function handleScrollToLatestClick() {
    listContainer?.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Home' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      listContainer?.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (event.key === 'End' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      scrollToBottom();
    }
  }
  
  // Get comment count text
  const commentCountText = $derived.by(() => {
    const count = comments.length;
    if (count === 0) return 'コメントはありません';
    if (count === 1) return '1件のコメント';
    return `${count}件のコメント`;
  });
  
  // Check if comment is new
  function isNewComment(commentId: string): boolean {
    return newCommentIds.has(commentId);
  }
</script>

<div class="comment-list-container" style="max-height: {maxHeight}">
  <!-- Header -->
  <div class="comment-list-header">
    <h2 class="comment-count" id="comment-list-title">
      {commentCountText}
    </h2>
    
    {#if comments.length > 0 && isScrolledFromTop}
      <button
        class="scroll-to-latest-btn"
        onclick={handleScrollToLatestClick}
        title="最新のコメントへ移動（上部）"
        aria-label="最新のコメントへスクロール"
      >
        <span class="scroll-icon">↑</span>
        最新へ
      </button>
    {/if}
  </div>
  
  <!-- Comment List -->
  <div 
    class="comment-list"
    class:has-comments={comments.length > 0}
    bind:this={listContainer}
    onscroll={handleScroll}
    onkeydown={handleKeydown}
    role="log"
    aria-live="polite"
    aria-labelledby="comment-list-title"
    aria-describedby="comment-list-instructions"
    tabindex="0"
    aria-label="コメント一覧スクロール可能エリア"
  >
    {#if comments.length > 0}
      {#each comments as comment (comment.id)}
        <div class="comment-item">
          <Comment 
            {comment} 
            isNew={isNewComment(comment.id)}
            showAnimation={true}
          />
        </div>
      {/each}
    {:else if showEmptyState}
      <div class="empty-state" role="status" aria-live="polite">
        <div class="empty-icon" aria-hidden="true">💬</div>
        <p class="empty-text">
          まだコメントがありません<br>
          最初のコメントを投稿してみましょう！
        </p>
      </div>
    {/if}
  </div>
  
  <!-- Screen reader instructions -->
  <div id="comment-list-instructions" class="sr-only">
    コメント一覧です。Ctrl+Homeで先頭へ、Ctrl+Endで最新へ移動できます。
  </div>
</div>

<style>
  .comment-list-container {
    display: flex;
    flex-direction: column;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
  }

  .comment-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .comment-count {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }

  .scroll-to-latest-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  }

  .scroll-to-latest-btn:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  }

  .scroll-to-latest-btn:active {
    transform: translateY(0);
  }

  .scroll-icon {
    font-size: 0.875rem;
    animation: bounce 2s infinite;
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-4px);
    }
    60% {
      transform: translateY(-2px);
    }
  }

  .comment-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    scroll-behavior: smooth;
  }

  .comment-list:focus {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
  }

  .comment-list.has-comments {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .comment-item {
    flex-shrink: 0;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
    color: #6b7280;
    height: 100%;
    min-height: 200px;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Custom scrollbar */
  .comment-list::-webkit-scrollbar {
    width: 6px;
  }

  .comment-list::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  .comment-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }

  .comment-list::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* Mobile responsive */
  @media (max-width: 640px) {
    .comment-list-header {
      padding: 0.75rem;
    }

    .comment-count {
      font-size: 0.875rem;
    }

    .scroll-to-latest-btn {
      padding: 0.375rem 0.625rem;
      font-size: 0.6875rem;
    }

    .comment-list {
      padding: 0.375rem;
      gap: 0.375rem;
    }

    .empty-state {
      padding: 2rem 1rem;
      min-height: 150px;
    }

    .empty-icon {
      font-size: 2.5rem;
    }

    .empty-text {
      font-size: 0.8125rem;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .comment-list {
      scroll-behavior: auto;
    }

    .scroll-icon {
      animation: none;
    }

    .scroll-to-latest-btn {
      transition: none;
    }
  }
</style>