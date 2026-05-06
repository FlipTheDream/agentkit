import { env as privateEnv } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import { fetchConfig } from "$lib/config";
import type { LayoutServerLoad } from "./$types";

// Server-only: reads INTERNAL_POCKETBASE_URL (docker DNS) to resolve
// /api/config during SSR. Public env is used as fallback. The returned
// config is forwarded to the universal +layout.ts load via parent().
export const load: LayoutServerLoad = async ({ fetch }) => {
  const endpoint =
    privateEnv.INTERNAL_POCKETBASE_URL ||
    publicEnv.PUBLIC_POCKETBASE_URL ||
    "http://backend:8090";
  const config = await fetchConfig(endpoint, fetch);
  return { config };
};
