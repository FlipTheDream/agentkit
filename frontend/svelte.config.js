import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    csrf: {
      // Cross-origin browser API calls (frontend → backend) are explicitly
      // allowed; the backend has its own auth layer. Kept as checkOrigin
      // for now — migrate to trustedOrigins when upgrading SvelteKit.
      checkOrigin: false
    }
  }
};

export default config;
