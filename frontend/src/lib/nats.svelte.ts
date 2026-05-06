import type { NatsConnection } from "nats.ws";
import { browser } from "$app/environment";

// `.svelte.ts` files may use Svelte 5 runes. `nats.ws` is dynamically
// imported only in the browser — it pulls in WebSocket globals that do
// not exist during Node SSR.

let nc: NatsConnection | null = $state(null);
let connected = $state(false);
let lastError: string | null = $state(null);

export function getNatsConnection() {
  return {
    get nc() {
      return nc;
    },
    get connected() {
      return connected;
    },
    get error() {
      return lastError;
    },
  };
}

export async function connectNats(url: string) {
  if (!browser) return;
  if (!url) {
    lastError = "connectNats: empty url";
    console.error(lastError);
    return;
  }
  try {
    const { connect } = await import("nats.ws");
    nc = await connect({
      servers: [url],
      timeout: 5000,
      reconnect: true,
      maxReconnectAttempts: 10,
    });
    connected = true;
    lastError = null;
    console.log("NATS connected to", url);
  } catch (e) {
    lastError = e instanceof Error ? e.message : "NATS connection failed";
    console.error("NATS connection error:", lastError);
  }
}

export async function publish(subject: string, data: string) {
  if (!nc || !connected) return;
  nc.publish(subject, data);
}

export async function disconnectNats() {
  if (nc) {
    await nc.close();
    connected = false;
  }
}
