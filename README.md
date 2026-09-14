# wasei_chord_solver

島岡譲系和声理論の和音記号（`○度調の（○度の○度）`のような内部調の入れ子、準/同主/プラス/マイナス、ナポリII度、ドリアIV度、変位VII、7/9/付加6/付加4、上変/下変、根省/5省、転回を含む）から、構成音・ピッチクラス・導出ステップを算出するツールです。

計算方式の理論的根拠は `../HANDOFF.md` §5「五度圏インデックスによる構成音導出アルゴリズム」、設計の詳細は `docs/superpowers/specs/2026-09-13-wasei-chord-solver-design.md` を参照してください。

## 使い方

`index.html` をブラウザで開くだけです（ビルド不要）。

GitHub Pagesでも公開しています: https://kazm00th.github.io/wasei_chord_solver/

## テスト

```bash
node test/core.test.js
node test/golden.test.js
```

外部依存ライブラリなし。Node標準の`assert`のみを使用しています。

## ファイル構成

- `core.js` — 計算ロジック本体（DOM非依存、Node/ブラウザ共用のUMD形式）
- `index.html` — UI
- `test/core.test.js` — 単体テスト
- `test/golden.json` / `test/golden.test.js` — HANDOFF.mdの検算例から抽出したリグレッションテスト
