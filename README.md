# llms-furl

Furl `llms-full.txt` (or `llms.txt` link lists) into a structured tree of small, searchable files you can assemble into LLM context with standard Unix tools.

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

No vectors, no tools. Just files and bash.

## Why filesystem-based context?

> "The primary lesson from the actually successful agents so far is the return to Unix fundamentals: file systems, shells, processes & CLIs. Don't fight the models, embrace the abstractions they're tuned for. Bash is all you need."
> — [@rauch](https://x.com/rauchg/status/1876851445796315362)

> LLM agents perform well with Unix-style workflows like `find`, `grep`, `jq`, and pipes. Rather than stuffing everything into the prompt, you can keep large context *local* in a filesystem and let agents retrieve smaller slices on demand — this is [filesystem-based context retrieval](https://vercel.com/changelog/introducing-bash-tool-for-filesystem-based-context-retrieval).

llms-furl turns context selection into a Unix problem, not a prompt-engineering problem.

## Install

Requirements: Node.js >= 20.

```bash
npm install -g llms-furl
# or one-off
npx llms-furl --help
```

## Quickstart

```bash
# llms-full.txt (monolithic docs)
npx llms-furl https://vercel.com/docs/llms-full.txt
npx llms-furl https://nextjs.org/docs/llms-full.txt
npx llms-furl https://platform.claude.com/llms-full.txt
npx llms-furl https://orm.drizzle.team/llms-full.txt
npx llms-furl https://polar.sh/docs/llms-full.txt

# llms.txt (link lists)
npx llms-furl https://supabase.com/llms.txt
npx llms-furl https://cursor.com/llms.txt
```

Example output:

```bash
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
fd . llms-furl/vercel.com/api | xargs cat

# Build a context for "file upload"
rg -l "file upload" llms-furl/vercel.com | xargs cat > context.txt
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

## Supported inputs

**`llms-full.txt`** — A monolithic document containing all docs. llms-furl splits it into leaf files along section boundaries.

**`llms.txt`** — A link list. llms-furl fetches each linked page and writes it as a leaf file. Relative links are resolved against the `llms.txt` URL.

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
