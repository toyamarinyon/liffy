# llms-full.txt split rules

## Sample analysis results

After analyzing five samples, we found four format patterns:

### Pattern A: `# Title` + `Source:` (axiom.co, supabase.com)

```
# Concepts
Source: https://axiom.co/docs/ai-engineering/concepts

Content...

# Create
Source: https://axiom.co/docs/ai-engineering/create

Content...
```

**Split rule**: A line starting with `^# ` and the next line `^Source: ` marks a new page boundary

### Pattern B: `<page>` tags (cloudflare)

```xml
<page>
---
title: 404 - Page Not Found | Cloudflare Docs
source_url:
  html: https://developers.cloudflare.com/404/
  md: https://developers.cloudflare.com/404/index.md
---

Content...

</page>

<page>
...
</page>
```

**Split rule**: Blocks wrapped by `<page>` and `</page>` tags

### Pattern C: `# Title` + `URL:` (platform.claude.com)

```
# Get started with Claude

URL: https://platform.claude.com/docs/en/get-started

# Get started with Claude

Content...
```

**Split rule**: A line starting with `^# `, a blank line, and then `^URL: ` marks a new page boundary

### Pattern D: Flat Markdown (modelcontextprotocol.io)

```
# Build an MCP client
Source: https://modelcontextprotocol.io/docs/develop/build-client

Content...

# Build an MCP server
Source: https://modelcontextprotocol.io/docs/develop/build-server

Content...
```

**Split rule**: Same as Pattern A (`# Title` + `Source:`)

---

## Unified split algorithm (draft)

```
1. Read the file header and detect the format:
   - `<page>` tag present -> Pattern B
   - `# ` + `Source:` -> Pattern A/D
   - `# ` + blank line + `URL:` -> Pattern C
   - otherwise -> default to Pattern A/D

2. Split based on the detected pattern:
   - Pattern B: split by `<page>...</page>`
   - Pattern A/D: split at `^# ` + next line `^Source:`
   - Pattern C: split at `^# ` + (blank line) + `^URL:`

3. Generate output paths from each page:
   - extract path from Source/URL
   - remove domain, add `.md` extension
   - example: `https://axiom.co/docs/ai-engineering/concepts`
         -> `docs/ai-engineering/concepts.md`
```

---

## Next steps

- [ ] Implement the algorithm above
- [ ] Check edge cases (e.g. `# ` inside code blocks)
- [ ] Verify Pattern A/D applies to the supabase.com sample
