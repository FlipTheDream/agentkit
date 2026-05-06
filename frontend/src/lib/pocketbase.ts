import PocketBase from "pocketbase";
import type { AppConfig } from "$lib/config";

let pbInstance: PocketBase | null = null;

// Returns a singleton PocketBase client initialized from the runtime
// config that was resolved in +layout.(server).ts and forwarded via
// `data.config` to components. Idempotent: subsequent calls reuse the
// existing instance but update the baseUrl if it has drifted.
export function getPbFromConfig(config: AppConfig): PocketBase {
  if (!pbInstance) {
    pbInstance = new PocketBase(config.pocketbaseUrl);
    pbInstance.autoCancellation(false);
  } else if (pbInstance.baseUrl !== config.pocketbaseUrl) {
    pbInstance.baseUrl = config.pocketbaseUrl;
  }
  return pbInstance;
}
