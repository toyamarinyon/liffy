## Design decisions

- llms-furl as npx tool. User use to `npm install -g llms-furl`
- Split rule spec: [./decisions/split-rule.md](./decisions/split-rule.md)
- index.json format: [./decisions/index-json.md](./decisions/index-json.md)
- URL input output is fixed under the domain (path is ignored)
- Flatten a single top-level directory: [./decisions/flatten-output-root.md](./decisions/flatten-output-root.md)
- Agent awareness strategy for llms-furl: [./decisions/agent-awareness.md](./decisions/agent-awareness.md)
- First-run integration (opensrc-style y/n consent and output): [./decisions/first-run-integration.md](./decisions/first-run-integration.md)
- Node-compatible runtime build with tsup: [./decisions/node-runtime-build.md](./decisions/node-runtime-build.md)

## Completed

- [x] Implement split algorithm -> `src/splitter.ts`
- [x] Edge case checks (e.g. `# ` inside code blocks) -> covered by tests
- [x] CLI implementation -> `index.ts`, `src/cli/`
  - split, list, remove, clean commands
  - lightweight arg parser (Bun.argv-based)
- [x] package.json setup for npx
- [x] URL fetch support (`llms-furl https://vercel.com/docs/llms-full.txt`)
- [x] Pattern D support (vercel format: dashed line separator)
- [x] Detect Pattern D with a Next.js llms-full preface header
- [x] Trim-aware dash line detection for Pattern D (works with CRLF)
- [x] Add `--debug/-d` for split diagnostics
- [x] Fix argument parsing so `--debug/-d` does not consume URLs
- [x] Prioritize Pattern D detection to avoid false `<page>` matches
- [x] Fix typecheck error (dash line log undefined)
- [x] Add tests to verify Pattern D debug logs
- [x] Lint fixes (node: import, regex loop, removal of non-null assertions)
- [x] Create index.json after splitting -> `src/cli/commands/split.ts`
- [x] Add guidance to root AGENTS.md on first run -> `src/agents.ts`, `src/cli/commands/split.ts`
- [x] Generate and polish llms-furl/AGENTS.md -> `src/agents.ts`, `src/cli/commands/split.ts`
- [x] Update the llms-full reference guide inserted into AGENTS.md during first-run integration -> `src/agents.ts`
- [x] Show first-run prompt to add llms-furl to tsconfig.json exclude -> `src/agents.ts`, `src/cli/commands/split.ts`
- [x] Tighten info/hint output on first run -> `src/cli/commands/split.ts`
- [x] Update first-run y/n prompt and consent flow -> `src/agents.ts`, `src/cli/commands/split.ts`
- [x] Fix ok task lint/typecheck/knip issues -> `src/agents.ts`, `src/cli/commands/split.ts`, `package.json`
- [x] Limit bun test to src (root config) -> [./bunfig.toml](./bunfig.toml)
- [x] Update agent awareness decision to match current implementation -> [./decisions/agent-awareness.md](./decisions/agent-awareness.md)
- [x] Translate workspace docs to English
- [x] Update README -> [./README.md](./README.md)
- [x] Rename package/CLI to llms-furl -> [./package.json](./package.json), [./README.md](./README.md), [./src/cli/args.ts](./src/cli/args.ts)
- [x] Add publish workflow dispatch with version bump -> [./.github/workflows/publish.yml](./.github/workflows/publish.yml)
- [x] Enable npm trusted publishing (OIDC) in publish workflow -> [./.github/workflows/publish.yml](./.github/workflows/publish.yml)
- [x] Add llms.txt link-list ingestion -> [./src/llms-txt.ts](./src/llms-txt.ts), [./src/cli/commands/split.ts](./src/cli/commands/split.ts), [./README.md](./README.md)
- [x] Fix llms.txt fetch failure typecheck (status parsing) -> [./src/cli/commands/split.ts](./src/cli/commands/split.ts)

## Next

- [ ] npm publish (llms-furl)

**Future plans:** see [roadmap.md](./roadmap.md)
