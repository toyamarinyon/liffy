# AGENTS.md

llms-furl turns a monolithic `llmsfull.txt` into a tree of leaves — small, searchable files you can assemble into LLM context with standard Unix tools.


## Helpful references

The idea of bringing internet text into the filesystem is similar to
`vercel-labs/opensrc`, so it is a good implementation reference.

The implementation lives in `opensrc/repos/github.com/vercel-labs/opensrc`, so
check it as needed.

## Our workspace

The `./.workspace-fs` directory is our working filesystem. It contains specs
under discussion, tasks in progress, and docs for libraries/frameworks we use.

### About state.md

[state.md](./workspace-fs/state.md) summarizes the current state of this
product. It captures key decisions and recent development tasks.

**Rules:**
- Reflect task progress and conclusions in `state.md`
- Link from `state.md` to related files so it serves as an index

### About scratchpads

`workspace-fs/scratchpads/` is a working notes area. Store prep materials or
in-progress thinking for AI requests.

**Rules:**
- When a discussion is finalized, move it to `workspace-fs/decisions/`
- You may rename the file to reflect the decision
- Update `state.md` with a link to the decision

## Coding rules

- Develop with Bun, but keep runtime code Node-compatible (Node >= 20).
- Do not use Bun-only APIs in runtime code.

Examples:

Good:
```ts
const args = process.argv.slice(2);
const content = await readFile(input, "utf-8");
```

Bad:
```ts
const args = Bun.argv.slice(2);
const content = await Bun.file(input).text();
```

<!-- opensrc:start -->

## Source Code Reference

Source code for dependencies is available in `opensrc/` for deeper understanding of implementation details.

See `opensrc/sources.json` for the list of available packages and their versions.

Use this source code when you need to understand how a package works internally, not just its types/interface.

### Fetching Additional Source Code

To fetch source code for a package or repository you need to understand, run:

```bash
npx opensrc <package>           # npm package (e.g., npx opensrc zod)
npx opensrc pypi:<package>      # Python package (e.g., npx opensrc pypi:requests)
npx opensrc crates:<package>    # Rust crate (e.g., npx opensrc crates:serde)
npx opensrc <owner>/<repo>      # GitHub repo (e.g., npx opensrc vercel/ai)
```

<!-- opensrc:end -->

<!-- llms-furl:start -->

## llms-full reference

When working on tasks about a library/framework/runtime/platform, first consult
`llms-furl/`, which contains llms-full.txt split into a tree of leaves — small,
searchable files for quick lookup.

Workflow:
1. Check domains in `llms-furl/AGENTS.md`.
2. Search within the relevant domain (e.g. `rg -n "keyword" llms-furl/bun.sh`).
3. If needed, navigate with `index.json` using `jq`.
4. If no relevant info is found, state that and then move on to other sources.

<!-- llms-furl:end -->
