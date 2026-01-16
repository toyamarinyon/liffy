# Node-compatible runtime build

## Decision

- Ship `llms-furl` as a Node.js (>=20) CLI, not Bun-only.
- Build publishable output with `tsup` (esbuild) and publish `dist/`.
- Remove Bun-specific runtime APIs (`Bun.argv`, `Bun.file`) in favor of Node APIs.
- Keep ESM (`"type": "module"`) and point the npm `bin` to `dist/index.js`.

## Notes

- Bundling does not polyfill the `Bun` global; runtime code must be
  Node-compatible.
- Ensure the output entrypoint has a Node shebang via `tsup`'s banner option.
