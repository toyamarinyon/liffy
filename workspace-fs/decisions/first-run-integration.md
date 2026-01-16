# First-run integration (opensrc-like)

## Decision

- liffy が統合のために更新できるファイルがある場合、TTY では **opensrc 風の一覧表示 + y/n プロンプト**で許可を取る。
- **y の場合のみ**ファイル更新を実行する（許可なく勝手に書き換えない）。
- 非TTY（CI 等）では **自動更新しない**。更新可能項目があることを短い hint として出すに留める。

## What liffy may update

- `.gitignore`: `liffy/` を ignore に追加
- `tsconfig.json`: `exclude` に `liffy` を追加（ただし JSONC 等で安全に更新できない場合は **自動更新せず**、手動更新の hint にフォールバック）
- `AGENTS.md`: `<!-- liffy:start --> ... <!-- liffy:end -->` のマーカー付きセクションを追加/更新

## Output (modeled after opensrc)

- TTY では以下のように表示する:
  - `liffy can update the following files for better integration:`
  - `• <file> - <what>`
  - `Allow liffy to modify these files? (y/n):`
- y を選択した場合は、許可を状態ファイルに保存し、適用した更新を `✓` で列挙する。

## State persistence

- liffy の状態ファイル `liffy/.liffy.json` に、初回統合の同意状態を保存する（例: `integration.consent` と `integration.applied`）。

## Notes

- `AGENTS.md` はマーカー付きスニペットで冪等に更新する（opensrc と同様のやり方）。
