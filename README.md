# llms-furl

Furl `llms-full.txt` into a structured tree of small, searchable files you can assemble into LLM context with standard Unix tools.

```text
                                          ├── api/
                                          │   ├── auth.md
┌──────────────────┐                      │   └── rate-limits.md
│  llms-full.txt   │  ─ npx llms-furl ─▶  ├── concepts/
│  (400KB blob)    │                      │   ├── context.md
└──────────────────┘                      │   └── rag.md
                                          └── examples/
                                              └── sdk.md
```

> *furl* /fɜːrl/ — to roll up; to make compact. A play on "full."

No embeddings. No vector store. Just files, trees, and pipes.

Requirements: Node.js >= 20.

## Install

```bash
npm install -g llms-furl
# or one-off
npx llms-furl --help
```

## Quickstart

```bash
llms-furl https://vercel.com/docs/llms-full.txt
tree -L 3 llms-furl/vercel.com
```

```text
llms-furl/
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
rg "rate" llms-furl/vercel.com/docs

# Collect all API-related docs
fd . llms-furl/vercel.com/docs/api | xargs cat

# Build a context for "file upload"
rg -l "file upload" llms-furl/vercel.com/docs | xargs cat > context.txt
```

Pipe that directly into your LLM:

```bash
cat context.txt | llm "Summarize how file uploads work in this API"
```

## Usage

```text
llms-furl <input> [output-dir]
llms-furl split <input> [output-dir]
llms-furl list [output-dir]
llms-furl remove <files...>
llms-furl rm <files...>
llms-furl clean [output-dir]
```

Options:
- `--debug`, `-d` show split diagnostics and flattening info
- `--help`, `-h` show help
- `--version`, `-v` show version

## Output layout

- URL input defaults to `llms-furl/<host>` (for example, `llms-furl/vercel.com`).
- File input defaults to the current directory unless `output-dir` is given.
- Output file paths are derived from each page URL (strip leading/trailing slashes and `.md`/`.html`).
- If all pages share one top-level directory (for example, `docs/`), llms-furl flattens it for URL inputs (shown in `--debug`).
- `index.json` is written alongside the output and contains a tree plus `source` (and `name` for URL inputs).

## Split patterns

llms-furl detects common llms-full formats automatically:

- Pattern A: `# Title` followed by `Source: https://...`
- Pattern B: `<page>...</page>` with frontmatter containing `source_url`
- Pattern C: `# Title`, blank line, then `URL: https://...`
- Pattern D: Vercel-style dash-separated blocks with `title:` and `source:`

Code blocks are ignored when detecting boundaries.

## Integration hints

When output is inside `llms-furl/`, llms-furl maintains `llms-furl/AGENTS.md` and may offer to update:

- `.gitignore` to ignore `llms-furl/`
- `tsconfig.json` to exclude `llms-furl`
- `AGENTS.md` to add a llms-furl section

In TTY, you get a y/n prompt; in non-interactive runs it prints hints only. Consent is stored in `llms-furl/.llms-furl.json`.

`llms-furl` lets you treat your LLM documentation the way Unix always wanted you to:
as a **living, searchable filesystem of knowledge**.

## Acknowledgments

This project was inspired by [opensrc](https://github.com/vercel-labs/opensrc). Thank you for the great idea!
