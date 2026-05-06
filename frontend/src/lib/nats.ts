import { connect, type NatsConnection } from "nats.ws";

let nc: NatsConnection | null = $state(null);
let connected = $state(false);
let error: string | null = $state(null);

export function getNatsConnection() {
  return {
    get nc() {
      return nc;
    },
    get connected() {
      return connected;
    },
    get error() {
      return error;
    },
  };
}

export async function connectNats() {
  const url = import.meta.env.PUBLIC_NATS_WS_URL || "ws://localhost:9222";
  try {
    nc = await connect({
      servers: [url],
      timeout: 5000,
      reconnect: true,
      maxReconnectAttempts: 10,
    });
    connected = true;
    error = null;
    console.log("NATS connected to", url);
  } catch (e) {
    error = e instanceof Error ? e.message : "NATS connection failed";
    console.error("NATS connection error:", error);
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
