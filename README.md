# liffy

liffy turns a monolithic `llmsfull.txt` into a tree of leaves — small, searchable files you can assemble into LLM context with standard Unix tools.

```bash
liffy https://vercel.com/docs/llms-full.txt
tree -L 3
````

```text
liffy/
└── vercel.com/docs
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

`liffy` lets you treat your LLM documentation the way Unix always wanted you to:
as a **living, searchable filesystem of knowledge**.
