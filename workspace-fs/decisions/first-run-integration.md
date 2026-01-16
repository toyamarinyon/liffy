# First-run integration (opensrc-like)

## Decision

- When liffy has files it can update for integration, in TTY request permission
  with an **opensrc-style list + y/n prompt**.
- Only update files when the user answers **y** (never modify without consent).
- In non-TTY environments (CI, etc.), **do not auto-update**. Only show a short
  hint that updates are available.

## What liffy may update

- `.gitignore`: add `liffy/` to ignore
- `tsconfig.json`: add `liffy` to `exclude` (if it cannot be updated safely,
  do **not** auto-update and fall back to a manual update hint)
- `AGENTS.md`: add/update a marker-wrapped section
  (`<!-- liffy:start --> ... <!-- liffy:end -->`)

## Output (modeled after opensrc)

- In TTY, show output like:
  - `liffy can update the following files for better integration:`
  - `- <file> - <what>`
  - `Allow liffy to modify these files? (y/n):`
- If the user selects y, persist consent in the state file and list applied
  updates with a check mark.

## State persistence

- Persist initial integration consent in the liffy state file
  `liffy/.liffy.json` (e.g. `integration.consent` and `integration.applied`).

## Notes

- Update `AGENTS.md` idempotently with marker-wrapped snippets (same approach as
  opensrc).
