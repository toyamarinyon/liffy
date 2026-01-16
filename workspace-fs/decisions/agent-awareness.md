# Agent awareness for llms-furl output

## Decision

- Do not generate a top-level `llms-furl/index.json`. Only per-domain
  `llms-furl/<domain>/index.json` is created.
- Always generate/update `llms-furl/AGENTS.md` as the entry point for llms-furl
  output. It explains what `llms-furl/` is, shows minimal usage examples, and
  lists domains by reading each `llms-furl/<domain>/index.json` (including
  optional `source`).
- Ensure root `AGENTS.md` contains a marker-wrapped llms-furl section pointing
  to `llms-furl/AGENTS.md`. If the file exists, update the marker section
  idempotently;
  if not, create a minimal `AGENTS.md` with the section.
- When output is inside `llms-furl/`, llms-furl can integrate with the repo on
  first run by offering to update these files (TTY only):
  - `.gitignore`: add `llms-furl/`
  - `tsconfig.json`: add `llms-furl` to `exclude` when a safe update is possible
  - `AGENTS.md`: add/update the llms-furl section
- If the user denies consent or the environment is non-interactive, do not edit
  repo files and print short hints instead.

## Notes

- Use marker-wrapped snippets (e.g. `<!-- llms-furl:start -->`) to keep
  `AGENTS.md`
  updates idempotent, following the opensrc approach.
- Persist integration consent in `llms-furl/.llms-furl.json`
  (`integration.consent` and `integration.applied`).
- `tsconfig.json` is only auto-edited if the `exclude` array can be updated
  safely; otherwise a manual update hint is shown.
