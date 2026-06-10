# DOX: skills

## Purpose

Local agent skill definitions. Each subdirectory contains a `SKILL.md` that the opencode skill tool loads on demand based on description matching. This folder is **not** part of the DOX walk — skills are not work contracts for subtrees of source code.

## Ownership

- `sveltekit5-performance-expert/SKILL.md` — SvelteKit 5 / Svelte 5 Runes performance guidance (loaded when working on `.svelte` / `+*.ts` / `+*.svelte` files)

## Local Contracts

- A skill is invoked by description, not by DOX chain traversal. The DOX walk ignores this folder.
- New skills: create `skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`, optional `globs`). The description drives auto-invocation; keep it specific.
- Skills are read-only reference material for the agent. They do not own source code, do not gate commits, and do not need verification steps.

## Work Guidance

- Do not place `AGENTS.md` files inside individual skill subdirectories — a skill is its own contract, not a child of DOX.
- If a skill's content drifts from current project standards, edit the `SKILL.md`, not this folder's contract.
- The top-level `SKILL.md` at the repo root is a different concept: it is the **agentkit** skill that downstream agents load to build applications on this framework. It is owned by the project README/root, not by this folder.

## Verification

## Child DOX Index

None.
