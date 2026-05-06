// Runtime configuration type + shared fallback/defaults.
//
// The actual /api/config fetch lives in route loads:
//   - +layout.server.ts  — SSR path, uses INTERNAL_POCKETBASE_URL
//   - +layout.ts         — universal passthrough + browser refresh
//
// $env/dynamic/private CANNOT be imported from universal modules, so all
// server-private env access must stay in *.server.* files.

import { env as publicEnv } from "$env/dynamic/public";

export type AppConfig = {
  pocketbaseUrl: string;
  natsWsUrl: string;
};

export function fallbackConfig(): AppConfig {
  return {
    pocketbaseUrl: publicEnv.PUBLIC_POCKETBASE_URL || "http://localhost:8090",
    natsWsUrl: publicEnv.PUBLIC_NATS_WS_URL || "ws://localhost:9222",
  };
}

export async function fetchConfig(
  endpoint: string,
  fetchFn: typeof fetch,
): Promise<AppConfig> {
  const url = `${endpoint.replace(/\/$/, "")}/api/config`;
  try {
    const res = await fetchFn(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Partial<AppConfig>;
    const fallback = fallbackConfig();
    return {
      pocketbaseUrl: data.pocketbaseUrl || fallback.pocketbaseUrl,
      natsWsUrl: data.natsWsUrl || fallback.natsWsUrl,
    };
  } catch (err) {
    console.warn(`fetchConfig: ${url} failed, using build-time fallback`, err);
    return fallbackConfig();
  }
}
