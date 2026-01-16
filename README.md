# liffy

liffy turns a monolithic `llms-full.txt` into a tree of leaves — small, searchable files you can assemble into LLM context with standard Unix tools.

Requirements: Bun >= 1.0.0.

## Install

```bash
npm install -g liffy
# or one-off
bunx liffy --help
```

## Quickstart

```bash
liffy https://vercel.com/docs/llms-full.txt
tree -L 3 liffy/vercel.com
```

```text
liffy/
└── vercel.com
    ├── index.json
    ├── api/
    │   ├── auth.md
    │   ├── files.md
    │   └── rate-limits.md
    ├── concepts/
    │   ├── context.md
    │   ├── rag.md
    │   └── tasks.md
    └── examples/
        ├── file-upload.md
        └── sdk.md
```

Each file is a **leaf** — a small, self-contained piece of the original document, split along its natural section boundaries.

Now you can use standard Unix tools to build exactly the context you need.

```bash
# Find anything related to rate limits
rg "rate" liffy/vercel.com/docs

# Collect all API-related docs
fd . liffy/vercel.com/docs/api | xargs cat

# Build a context for "file upload"
rg -l "file upload" liffy/vercel.com/docs | xargs cat > context.txt
```

Pipe that directly into your LLM:

```bash
cat context.txt | llm "Summarize how file uploads work in this API"
```

No embeddings.
No vector store.
Just files, trees, and pipes.

## Usage

```text
liffy <input> [output-dir]
liffy split <input> [output-dir]
liffy list [output-dir]
liffy remove <files...>
liffy rm <files...>
liffy clean [output-dir]
```

Options:
- `--debug`, `-d` show split diagnostics and flattening info
- `--help`, `-h` show help
- `--version`, `-v` show version

## Output layout

- URL input defaults to `liffy/<host>` (for example, `liffy/vercel.com`).
- File input defaults to the current directory unless `output-dir` is given.
- Output file paths are derived from each page URL (strip leading/trailing slashes and `.md`/`.html`).
- If all pages share one top-level directory (for example, `docs/`), liffy flattens it for URL inputs (shown in `--debug`).
- `index.json` is written alongside the output and contains a tree plus `source` (and `name` for URL inputs).

## Split patterns

liffy detects common llms-full formats automatically:

- Pattern A: `# Title` followed by `Source: https://...`
- Pattern B: `<page>...</page>` with frontmatter containing `source_url`
- Pattern C: `# Title`, blank line, then `URL: https://...`
- Pattern D: Vercel-style dash-separated blocks with `title:` and `source:`

Code blocks are ignored when detecting boundaries.

## Integration hints

When output is inside `liffy/`, liffy maintains `liffy/AGENTS.md` and may offer to update:

- `.gitignore` to ignore `liffy/`
- `tsconfig.json` to exclude `liffy`
- `AGENTS.md` to add a liffy section

In TTY, you get a y/n prompt; in non-interactive runs it prints hints only. Consent is stored in `liffy/.liffy.json`.

`liffy` lets you treat your LLM documentation the way Unix always wanted you to:
as a **living, searchable filesystem of knowledge**.
