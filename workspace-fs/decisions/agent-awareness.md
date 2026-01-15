# Agent awareness for liffy output

## Decision

- Do not generate a top-level `liffy/index.json`.
- On first run, append a snippet to root `AGENTS.md` that points to
  `liffy/AGENTS.md`.
- Generate `liffy/AGENTS.md` as the entry point for liffy output. It should
  include what `liffy/` is, how to navigate per-domain `index.json`, and minimal
  usage examples.
- Do not auto-edit `tsconfig.json` (JSONC). Instead, print a first-run hint to
  add `liffy` to `exclude`.

## Notes

- Use marker-wrapped snippets (e.g. `<!-- liffy:start -->`) to keep updates
  idempotent, following the opensrc approach.
