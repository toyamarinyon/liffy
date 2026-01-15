## Design decisions

- liffy as npx tool. User use to `npm install -g liffy`
- 分割ルール仕様: [./decisions/split-rule.md](./decisions/split-rule.md)

## Completed

- [x] 分割アルゴリズムの実装 → `src/splitter.ts`
- [x] エッジケース確認（コードブロック内の `# ` など）→ テストで確認済み
- [x] CLI実装 → `index.ts`, `src/cli/`
  - split, list, remove, clean コマンド
  - 軽量argパーサー（Bun.argvベース）
- [x] npx対応のpackage.json設定

## Next

- [ ] npm publish
- [ ] README.md 更新
