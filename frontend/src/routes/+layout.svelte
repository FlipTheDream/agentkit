<script>
  import '../app.css';
  import { getPbFromConfig } from '$lib/pocketbase';
  import { connectNats, disconnectNats, getNatsConnection } from '$lib/nats.svelte';
  import { onMount } from 'svelte';

  let { data, children } = $props();

  let pbConnected = $state(false);

  onMount(() => {
    // Eagerly initialize PB singleton with the resolved config.
    getPbFromConfig(data.config);

    checkPbHealth();
    connectNats(data.config.natsWsUrl);

    return () => {
      disconnectNats();
    };
  });

  async function checkPbHealth() {
    try {
      const res = await fetch(`${data.config.pocketbaseUrl}/api/health`);
      pbConnected = res.ok;
    } catch {
      pbConnected = false;
    }
  }

  $effect(() => {
    const interval = setInterval(checkPbHealth, 15000);
    return () => clearInterval(interval);
  });
</script>

<div class="layout">
  <header class="header">
    <div class="header-left">
      <span class="logo">Agentkit</span>
    </div>
    <div class="header-right">
      <span class="status-indicator" class:online={pbConnected} class:offline={!pbConnected}>
        <span class="dot"></span>
        API
      </span>
      <span class="status-indicator" class:online={getNatsConnection().connected} class:offline={!getNatsConnection().connected}>
        <span class="dot"></span>
        NATS
      </span>
    </div>
  </header>
  <main class="main">
    {@render children()}
  </main>
</div>

<style>
  .layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    height: 56px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }

  .logo {
    font-size: 18px;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: -0.3px;
  }

  .header-right {
    display: flex;
    gap: 16px;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--error);
  }

  .status-indicator.online .dot {
    background: var(--success);
    box-shadow: 0 0 6px var(--success);
  }

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
</style>
