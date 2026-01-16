# Roadmap

## v0.1 (Current)

- [x] 分割アルゴリズム（Pattern A/B/C対応）
- [x] CLI実装（split, list, remove, clean）
- [x] URL fetch対応
- [ ] npm publish

## v0.2

- [ ] APIサーバ
  - Gateway的な役割
  - キャッシュ機能（同じURLの再取得を避ける）
  - Telemetry（利用統計、人気ドキュメントなど）

## Future Ideas

- [ ] `liffy update` - 既存の分割ファイルを最新に更新
- [ ] `liffy search` - 分割ファイル内を検索
- [ ] カスタムパターン定義（ユーザー定義の分割ルール）
- [ ] `.liffyrc` 設定ファイル
