## Design decisions

- liffy as npx tool. User use to `npm install -g liffy`
- 分割ルール仕様: [./decisions/split-rule.md](./decisions/split-rule.md)

## Completed

- [x] 分割アルゴリズムの実装 → `src/splitter.ts`
- [x] エッジケース確認（コードブロック内の `# ` など）→ テストで確認済み

## Next

- [ ] CLI実装（ファイル入出力）
- [ ] npx対応のpackage.json設定
