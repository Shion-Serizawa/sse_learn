<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { connectionStore, connectionStatsStore } from '../stores/commentStore';
  import type { SseConnectionState } from '../types/sse';
  
  // Props
  interface Props {
    onReconnectClick?: () => void;
    showStats?: boolean;
    compact?: boolean;
  }
  
  let { 
    onReconnectClick, 
    showStats = true, 
    compact = false 
  }: Props = $props();
  
  // State
  let connectionState = $state<SseConnectionState>('disconnected');
  let connectionStats = $state({
    totalConnections: 0,
    reconnectAttempts: 0,
    lastConnectionTime: null as Date | null,
    lastDisconnectionTime: null as Date | null
  });
  
  let unsubscribeConnection: (() => void) | null = null;
  let unsubscribeStats: (() => void) | null = null;
  
  // Subscribe to stores
  onMount(() => {
    unsubscribeConnection = connectionStore.subscribe((state) => {
      connectionState = state;
    });
    
    unsubscribeStats = connectionStatsStore.subscribe((stats) => {
      connectionStats = stats;
    });
  });
  
  onDestroy(() => {
    unsubscribeConnection?.();
    unsubscribeStats?.();
  });
  
  // Connection state display properties
  const stateConfig = $derived(() => {
    switch (connectionState) {
      case 'connected':
        return {
          icon: '🟢',
          text: '接続中',
          description: 'リアルタイムでコメントを受信しています',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          showReconnectButton: false
        };
      case 'connecting':
        return {
          icon: '🟡',
          text: '接続中...',
          description: 'サーバーに接続しています',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          showReconnectButton: false
        };
      case 'reconnecting':
        return {
          icon: '🔄',
          text: '再接続中...',
          description: `再接続を試行しています (${connectionStats.reconnectAttempts}回目)`,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          showReconnectButton: false
        };
      case 'error':
        return {
          icon: '🔴',
          text: '接続エラー',
          description: '接続に失敗しました。手動で再接続を試してください',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          showReconnectButton: true
        };
      case 'disconnected':
      default:
        return {
          icon: '⚫',
          text: '切断中',
          description: 'サーバーとの接続が切断されています',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          showReconnectButton: true
        };
    }
  });
  
  // Handle reconnect button click
  function handleReconnectClick() {
    onReconnectClick?.();
  }
  
  // Format last connection time
  function formatLastConnectionTime(): string {
    if (!connectionStats.lastConnectionTime) return '未接続';
    
    const now = new Date();
    const diff = now.getTime() - connectionStats.lastConnectionTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return '直前に接続';
    if (minutes < 60) return `${minutes}分前に接続`;
    if (hours < 24) return `${hours}時間前に接続`;
    
    return connectionStats.lastConnectionTime.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Format last disconnection time
  function formatLastDisconnectionTime(): string {
    if (!connectionStats.lastDisconnectionTime) return '未切断';
    
    const now = new Date();
    const diff = now.getTime() - connectionStats.lastDisconnectionTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return '直前に切断';
    if (minutes < 60) return `${minutes}分前に切断`;
    
    return connectionStats.lastDisconnectionTime.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Is animation needed
  const showAnimation = $derived(
    connectionState === 'connecting' || connectionState === 'reconnecting'
  );
</script>

<div 
  class="connection-status"
  class:compact
  class:with-animation={showAnimation}
  role="status"
  aria-live="polite"
  aria-label="接続状態"
>
  <!-- Status indicator -->
  <div class="status-indicator {stateConfig.bgColor} {stateConfig.borderColor}">
    <div class="status-icon" class:spinning={showAnimation}>
      {stateConfig.icon}
    </div>
    
    <div class="status-content">
      <div class="status-text {stateConfig.color}">
        {stateConfig.text}
      </div>
      
      {#if !compact}
        <div class="status-description">
          {stateConfig.description}
        </div>
      {/if}
    </div>
    
    {#if stateConfig.showReconnectButton}
      <button
        class="reconnect-button"
        onclick={handleReconnectClick}
        title="手動で再接続"
        aria-label="サーバーに再接続"
      >
        🔄 再接続
      </button>
    {/if}
  </div>
  
  <!-- Connection stats -->
  {#if showStats && !compact}
    <div class="connection-stats">
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">総接続回数</span>
          <span class="stat-value">{connectionStats.totalConnections}回</span>
        </div>
        
        <div class="stat-item">
          <span class="stat-label">再接続試行</span>
          <span class="stat-value">{connectionStats.reconnectAttempts}回</span>
        </div>
        
        <div class="stat-item">
          <span class="stat-label">最終接続</span>
          <span class="stat-value">{formatLastConnectionTime()}</span>
        </div>
        
        {#if connectionStats.lastDisconnectionTime}
          <div class="stat-item">
            <span class="stat-label">最終切断</span>
            <span class="stat-value">{formatLastDisconnectionTime()}</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .connection-status {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    font-size: 0.875rem;
  }

  .connection-status.compact {
    gap: 0;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid;
    transition: all 0.2s ease;
  }

  .compact .status-indicator {
    padding: 0.5rem 0.75rem;
    gap: 0.5rem;
  }

  .status-icon {
    font-size: 1.125rem;
    flex-shrink: 0;
    line-height: 1;
  }

  .status-icon.spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .status-content {
    flex: 1;
    min-width: 0;
  }

  .status-text {
    font-weight: 600;
    line-height: 1.2;
  }

  .status-description {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.125rem;
    line-height: 1.3;
  }

  .reconnect-button {
    flex-shrink: 0;
    padding: 0.5rem 0.75rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .reconnect-button:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  .reconnect-button:active {
    transform: translateY(0);
  }

  .connection-stats {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.75rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .stat-label {
    font-size: 0.6875rem;
    color: #6b7280;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .stat-value {
    font-size: 0.75rem;
    color: #374151;
    font-weight: 600;
  }

  /* Pulse animation for connecting states */
  .with-animation .status-indicator {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }

  /* Mobile responsive */
  @media (max-width: 640px) {
    .status-indicator {
      padding: 0.625rem 0.75rem;
      gap: 0.625rem;
    }

    .status-icon {
      font-size: 1rem;
    }

    .status-text {
      font-size: 0.8125rem;
    }

    .status-description {
      font-size: 0.6875rem;
    }

    .reconnect-button {
      padding: 0.375rem 0.625rem;
      font-size: 0.6875rem;
    }

    .connection-stats {
      padding: 0.625rem;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .stat-label {
      font-size: 0.625rem;
    }

    .stat-value {
      font-size: 0.6875rem;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .status-icon.spinning {
      animation: none;
    }

    .with-animation .status-indicator {
      animation: none;
    }

    .reconnect-button {
      transition: none;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .status-indicator {
      border-width: 2px;
    }

    .connection-stats {
      border-width: 2px;
    }
  }
</style>