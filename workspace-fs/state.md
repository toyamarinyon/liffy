## Design decisions

- liffy as npx tool. User use to `npm install -g liffy`
- 分割ルール仕様: [./decisions/split-rule.md](./decisions/split-rule.md)
- index.json format: [./decisions/index-json.md](./decisions/index-json.md)
- URL inputの出力先はドメイン配下に固定（pathは無視）
- 単一のトップレベルディレクトリはフラット化: [./decisions/flatten-output-root.md](./decisions/flatten-output-root.md)
- Agentにliffyを認知させる方針: [./decisions/agent-awareness.md](./decisions/agent-awareness.md)

## Completed

- [x] 分割アルゴリズムの実装 → `src/splitter.ts`
- [x] エッジケース確認（コードブロック内の `# ` など）→ テストで確認済み
- [x] CLI実装 → `index.ts`, `src/cli/`
  - split, list, remove, clean コマンド
  - 軽量argパーサー（Bun.argvベース）
- [x] npx対応のpackage.json設定
- [x] URL fetch対応 (`liffy https://vercel.com/docs/llms-full.txt`)
- [x] Pattern D対応（vercel形式: ダッシュライン区切り）
- [x] Next.js llms-fullの前置きヘッダー付きPattern Dを検出
- [x] Pattern Dのダッシュライン検出をtrim対応（CRLFでも判定）
- [x] splitの診断ログ用に`--debug/-d`を追加
- [x] `--debug/-d`がURLを誤消費しないよう引数パースを修正
- [x] Pattern D検出を優先し、`<page>`の誤検出を回避
- [x] typecheckエラー（dash lineログのundefined）を修正
- [x] Pattern Dのdebugログを検証するテストを追加
- [x] lint対応（node: import、regex loop、non-null断言の削除）
- [x] 分割後にindex.jsonを作成 → `src/cli/commands/split.ts`
- [x] 初回起動で root AGENTS.md に案内を追記 → `src/agents.ts`, `src/cli/commands/split.ts`
- [x] liffy/AGENTS.md の生成と内容整備 → `src/agents.ts`, `src/cli/commands/split.ts`
- [x] 初回実行時に tsconfig.json exclude 追加を促す表示 → `src/agents.ts`, `src/cli/commands/split.ts`

## Next

- [ ] npm publish
- [ ] README.md 更新

**将来計画:** [roadmap.md](./roadmap.md) 参照
