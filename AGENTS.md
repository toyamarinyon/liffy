# AGENTS.md

liffy turns a monolithic `llmsfull.txt` into a tree of leaves — small, searchable files you can assemble into LLM context with standard Unix tools.


## 参考になるもの

インターネット上のテキストをファイルシステムに持ってくるという考え方は`vercel-labs/opensrc`も近いので、実装の参考になると思います。

`opensrc/repos/github.com/vercel-labs/opensrc` に実装があるので適宜確認してください。

## Our workspace

`./.workspace-fs` ディレクトリは私たちの作業ファイルシステムです。検討中の仕様や、実装中のタスク、その他利用するライブラリ、フレームワークのドキュメントなどがあります。

### state.md について

[state.md](./workspace-fs/state.md) はこのプロダクトの現在の状態をまとめたファイルです。重要な意思決定や直近の開発タスクがまとまっています。

**ルール:**
- タスクの進捗や検討結果は必ず `state.md` に反映する
- `state.md` から関連ファイルへリンクを貼り、indexとして機能させる

### scratchpads について

`workspace-fs/scratchpads/` は作業用メモ置き場です。人間がAIに依頼するための下準備や検討中の内容を置きます。

**ルール:**
- 検討が完了したら `workspace-fs/decisions/` に移動する
- 移動時はファイル名を決定事項を表す名前に変更してもよい
- `state.md` に決定事項へのリンクを更新する

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
