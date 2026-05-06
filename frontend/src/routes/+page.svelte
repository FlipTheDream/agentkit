<script>
  import { publish } from '$lib/nats.svelte';
  import { onMount } from 'svelte';

  let { data } = $props();

  let helloMessage = $state('');
  let helloTime = $state('');
  let loading = $state(true);

  const adminUrl = $derived(`${data.config.pocketbaseUrl}/_/`);
  const natsMonitorUrl = $derived(data.config.pocketbaseUrl.replace(/:\d+$/, ':8222'));

  onMount(() => {
    fetchHello();
    const interval = setInterval(sendHeartbeat, 5000);
    return () => clearInterval(interval);
  });

  async function fetchHello() {
    try {
      const res = await fetch(`${data.config.pocketbaseUrl}/api/hello`);
      const payload = await res.json();
      helloMessage = payload.app;
      helloTime = new Date(payload.time).toLocaleTimeString();
    } catch {
      helloMessage = 'Agentkit';
      helloTime = 'offline';
    }
    loading = false;
  }

  function sendHeartbeat() {
    publish('agentkit.heartbeat', JSON.stringify({ ts: Date.now() }));
  }
</script>

<div class="dashboard">
  <div class="hero">
    {#if loading}
      <div class="spinner"></div>
    {:else}
      <h1 class="title">{helloMessage}</h1>
      <p class="subtitle">Fullstack Development Framework</p>
      <p class="time">Server time: {helloTime}</p>
    {/if}
  </div>

  <div class="cards">
    <div class="card">
      <div class="card-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18M9 3v18"/>
        </svg>
      </div>
      <h3>Pocketbase</h3>
      <p>Auth &middot; Database &middot; Realtime SSE</p>
      <a href={adminUrl} target="_blank" class="card-link">Admin Panel</a>
    </div>

    <div class="card">
      <div class="card-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 20V10M12 20V4M6 20v-6"/>
        </svg>
      </div>
      <h3>SvelteKit 5</h3>
      <p>Runes &middot; HMR &middot; TypeScript</p>
      <a href="https://svelte.dev/docs/kit" target="_blank" class="card-link">Documentation</a>
    </div>

    <div class="card">
      <div class="card-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
      <h3>NATS</h3>
      <p>Pub/Sub &middot; WebSocket &middot; Realtime</p>
      <a href={natsMonitorUrl} target="_blank" class="card-link">Monitoring</a>
    </div>
  </div>
</div>

<style>
  .dashboard {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    gap: 48px;
  }

  .hero {
    text-align: center;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .title {
    font-size: 48px;
    font-weight: 800;
    background: linear-gradient(135deg, var(--accent), #818cf8, #c084fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
  }

  .subtitle {
    font-size: 18px;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .time {
    font-size: 13px;
    color: var(--text-muted);
    font-family: monospace;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 720px;
    width: 100%;
  }

  @media (max-width: 640px) {
    .cards {
      grid-template-columns: 1fr;
    }
  }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .card:hover {
    border-color: var(--accent);
    box-shadow: 0 0 20px var(--accent-glow);
  }

  .card-icon {
    color: var(--accent);
    margin-bottom: 12px;
    display: flex;
    justify-content: center;
  }

  .card h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .card p {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 12px;
  }

  .card-link {
    font-size: 13px;
    color: var(--accent);
    text-decoration: none;
    font-weight: 500;
  }

  .card-link:hover {
    text-decoration: underline;
  }
</style>
