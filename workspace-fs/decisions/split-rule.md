# llms-full.txt 分割ルール

## サンプル分析結果

5つのサンプルを調査した結果、3つのフォーマットパターンを発見:

### Pattern A: `# Title` + `Source:` (axiom.co, supabase.com)

```
# Concepts
Source: https://axiom.co/docs/ai-engineering/concepts

コンテンツ...

# Create
Source: https://axiom.co/docs/ai-engineering/create

コンテンツ...
```

**分割ルール**: `^# ` で始まる行 + 次行が `^Source: ` の場合、新規ページ区切り

### Pattern B: `<page>` タグ (cloudflare)

```xml
<page>
---
title: 404 - Page Not Found | Cloudflare Docs
source_url:
  html: https://developers.cloudflare.com/404/
  md: https://developers.cloudflare.com/404/index.md
---

コンテンツ...

</page>

<page>
...
</page>
```

**分割ルール**: `<page>` と `</page>` タグで囲まれたブロック

### Pattern C: `# Title` + `URL:` (platform.claude.com)

```
# Get started with Claude

URL: https://platform.claude.com/docs/en/get-started

# Get started with Claude

コンテンツ...
```

**分割ルール**: `^# ` で始まる行 + 空行 + `^URL: ` の場合、新規ページ区切り

### Pattern D: フラットMarkdown (modelcontextprotocol.io)

```
# Build an MCP client
Source: https://modelcontextprotocol.io/docs/develop/build-client

コンテンツ...

# Build an MCP server
Source: https://modelcontextprotocol.io/docs/develop/build-server

コンテンツ...
```

**分割ルール**: Pattern Aと同じ（`# Title` + `Source:`）

---

## 統合分割アルゴリズム（案）

```
1. ファイル先頭を読み、フォーマット検出:
   - `<page>` タグ存在 → Pattern B
   - `# ` + `Source:` → Pattern A/D
   - `# ` + 空行 + `URL:` → Pattern C
   - それ以外 → Pattern A/D をデフォルトとして試行

2. 検出パターンに基づき分割:
   - Pattern B: `<page>...</page>` でsplit
   - Pattern A/D: `^# ` + 次行 `^Source:` で split
   - Pattern C: `^# ` + (空行) + `^URL:` で split

3. 各ページから出力パス生成:
   - Source/URL からパス抽出
   - ドメイン除去、`.md` 拡張子付与
   - 例: `https://axiom.co/docs/ai-engineering/concepts` 
         → `docs/ai-engineering/concepts.md`
```

---

## 次のステップ

- [ ] 上記アルゴリズムの実装
- [ ] エッジケース確認（コードブロック内の `# ` など）
- [ ] supabase.com サンプルでもPattern A/Dが適用可能か確認
