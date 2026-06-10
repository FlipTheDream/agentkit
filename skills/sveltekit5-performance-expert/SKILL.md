---
name: sveltekit5-performance-expert
description: Specialized knowledge for SvelteKit 5 & Svelte 5 Runes to outpace React-style performance and architectures.
globs: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js", "src/routes/**/+*.ts", "src/routes/**/+*.js", "src/routes/**/+*.svelte"]
---

# SvelteKit 5 & Runes Performance Engine

You are an expert software engineer specializing in SvelteKit 5 and Svelte 5 (Runes). Your primary goal is to build web pages that significantly outperform React by leveraging Svelte’s compile-time reactivity, zero-virtual-DOM architecture, and direct DOM mutations. 

Follow these absolute architectural guardrails to eliminate React anti-patterns and unlock peak performance.

## 1. Core Reactivity ($state vs useState)
Never attempt to port React hook behaviors (`useState`, `useMemo`, `useEffect`) into Svelte 5. Svelte uses universal, proxy-based Runes.

- **Local Mutable State:** Always use `$state()` for local reactive variables.
- **Deep Reactivity:** `$state()` is deeply reactive by default. For large tracking metrics or raw performance gains with heavy arrays (>1000 items), use `$state.raw()` to opt-out of deep proxy wrappers and force value-replacement tracking.
- **Derived Values:** Use `$derived()` for computed state. Never assign variables within an effect to mimic a computed value. `$derived` scales synchronously and safely without triggering extra render passes.
- **State Destructuring Warning:** Never destructure a object/prop wrapped in `$state`. Destructuring creates a static, snapshot copy and completely breaks reactivity. Keep object paths explicit (e.g., `user.name` rather than `{ name } = user`).

## 2. Component Properties & Actions (Props, Snippets, Events)
Svelte 5 entirely removes legacy HTML namespaces (`on:click`) and `<slot />` mechanics in favor of explicit attributes.

- **Props Declaration:** Declare props exclusively using destructuring of the universal `$props()` rune.
- **Bi-directional Mutability:** By default, child components cannot mutate props passed by a parent. If a component must mutate a parent variable via a shared reference, explicitly wrap it with the `$bindable()` rune.
- **Replacing Slots with Snippets:** Do not write `<slot />` or `<slot name="header" />`. Use the `{#snippet}` syntax. Pass snippets as custom layout functions and invoke them using the `{@render snippetName()}` control block.
- **Native DOM Events:** Do not use `createEventDispatcher`. Events are standard JavaScript callback attributes. Pass event handlers downward as basic function props (e.g., `onclick={handleEvent}`, `onsubmit={handleSubmit}`).

## 3. Side Effects ($effect vs useEffect)
React devs over-rely on `useEffect`. In Svelte 5, `$effect` is a last resort tool reserved primarily for manual DOM operations, analytics, or third-party non-reactive integrations.

- **Browser Only Execution:** `$effect` and `$effect.pre` run **strictly** in the browser ecosystem. They never run during Server-Side Rendering (SSR). Never initialize critical layout data inside an effect that must be visible on initial page load.
- **Asynchronous Tracking Breakage:** Svelte only tracks reactive dependencies read *synchronously* before the first `await` keyword in an effect block. Capture all required variables up-front before initiating promises.
- **Infinite Loop Avoidance:** Reading and writing to the exact same `$state` node inside a single `$effect` triggers an endless cascade. If a value must be read without registering a new tracking boundary, wrap that read function inside the `untrack()` utility from `'svelte'`.

## 4. SvelteKit 5 Enterprise Routing & Server States
SvelteKit provides exceptional UX by handling route parsing, data streaming, and page hydration out of the box.

- **Type-Safe Form Actions:** Handle all layout data-mutation requests utilizing native `+page.server.ts` Form Actions via `<form method="POST">`. Use SvelteKit's `enhance` directive (`use:enhance`) to handle form serialization asynchronously, maintaining a zero-JS fallback path.
- **Asynchronous Data Streaming:** For long-running, database-heavy page loads, use native streaming. Do not make the user wait for a blocked HTTP route. Pass un-awaited nested promises inside your server-side `load` function, and resolve them progressively on the webpage UI using Svelte’s native `{#await}` blocks.
- **Strict Hydration Separation:** Separate layout state cleanly. Place server actions and preliminary data reads exclusively inside `+page.server.ts` or `+layout.server.ts` targets. Use front-end UI files (`+page.svelte`) solely to present structural markup and process downstream interaction runes.

## Code Blueprint Examples

### Correct Component Architecture (Svelte 5 Runes)
```svelte
<script lang="ts">
	import { untrack } from 'svelte';

	// 1. Explicit Prop Extraction & Custom Component Layout Snippets
	let { 
		initialCount = 0, 
		headerSnippet, 
		children,
		onchange 
	} = \$props<{
		initialCount?: number;
		headerSnippet?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
		onchange?: (v: number) => void;
	}>();

	// 2. High-Performance Local States
	let count = \$state(initialCount);
	let multiplier = \$state(2);

	// 3. Synchronous Derived States
	let doubled = \$derived(count * multiplier);

	// 4. Safe Side Effects
	\$effect(() => {
		// Log the count safely without triggering loops on the multiplier
		console.log(`Count changed to: ${count}`);
		const currentMultiplier = untrack(() => multiplier);
		console.log(`Current detached multiplier: ${currentMultiplier}`);
	});

	function increment() {
		count += 1;
		if (onchange) onchange(count);
	}
</script>

<div class="card-container">
	{#if headerSnippet}
		{@render headerSnippet()}
	{/if}

	<button onclick={increment}>
		Clicks: {count} (Doubled: {doubled})
	</button>

	{#if children}
		{@render children()}
	{/if}
</div>
```

### Correct SvelteKit Progressively Streamed Loader
```ts
// src/routes/dashboard/+page.server.ts
import type { PageServerLoad } from './\$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Fast, non-blocking data resolves immediately
	const fastUserData = { username: 'SvelteDev_01', tier: 'pro' };

	// Heavy database queries are passed down as raw un-awaited promises
	const slowTelemetryPromise = new Promise(resolve => 
		setTimeout(() => resolve({ activeConnections: 1420, memoryUsage: '42%' }), 1500)
	);

	return {
		fastUserData,
		streamed: {
			telemetry: slowTelemetryPromise
		}
	};
};
```

```svelte
<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
	let { data } = \$props();
</script>

<h1>Welcome back, {data.fastUserData.username}</h1>

<!-- Immediate UI rendering while heavy background threads process -->
{#await data.streamed.telemetry}
	<p class="animate-pulse">Streaming heavy telemetry data from server...</p>
{:then telemetry}
	<div class="stats-grid">
		<div>Connections: {telemetry.activeConnections}</div>
		<div>System Load: {telemetry.memoryUsage}</div>
	</div>
{:catch error}
	<p class="text-red-500">Failed to stream metrics: {error.message}</p>
{/if}
```
