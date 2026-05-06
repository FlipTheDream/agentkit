import { browser } from "$app/environment";
import { env as publicEnv } from "$env/dynamic/public";
import { fetchConfig, type AppConfig } from "$lib/config";
import type { LayoutLoad } from "./$types";

// Universal load: on SSR, inherits `config` from +layout.server.ts.
// On client navigation, re-fetches /api/config via the public URL so
// cached SSR values don't go stale during a long session.
export const load: LayoutLoad = async ({ fetch, data }) => {
  if (!browser) {
    return data as { config: AppConfig };
  }
  const endpoint = publicEnv.PUBLIC_POCKETBASE_URL || window.location.origin;
  const config = await fetchConfig(endpoint, fetch);
  return { config };
};
