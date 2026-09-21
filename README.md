# wasei_chord_solver

島岡譲系和声理論の和音記号（`○度調の（○度の○度）`のような内部調の入れ子、準/同主/プラス/マイナス、ナポリII度、ドリアIV度、変位VII、7/9/付加6/付加4、上変/下変、根省/5省、転回を含む）から、構成音・ピッチクラス・導出ステップを算出するツールです。

あわせて**転義可能性**（その構成音が他のどの調のどの和音として読み替えられるか）を一覧します。表は記号ではなくピッチクラス集合で引くので、カタログ106件に無い和音でも構成音が一致すれば読み替え先を出せます。減7や増三和音のように移調しても自分に重なる和音は、重なる分だけ複数の調に現れます。理論と検算は harmony の `HANDOFF.md` §5「段階B」。

計算方式の理論的根拠は `../HANDOFF.md` §5「五度圏インデックスによる構成音導出アルゴリズム」、設計の詳細は `docs/superpowers/specs/2026-09-13-wasei-chord-solver-design.md` を参照してください。

## 使い方

`index.html` をブラウザで開くだけです（ビルド不要）。

GitHub Pagesでも公開しています: https://kazm00th.github.io/wasei_chord_solver/

## テスト

```bash
node test/core.test.js
node test/golden.test.js
node test/tengi.test.js
```

外部依存ライブラリなし。Node標準の`assert`のみを使用しています。

## ファイル構成

- `core.js` — 計算ロジック本体（DOM非依存、Node/ブラウザ共用のUMD形式）
- `catalog.js` — 『総合和声』の和音カタログ〈記号 × 旋法〉106件（記号→spec。構成音は持たない）。harmony の `data/stage_b_input.json` のコピーで、同期は harmony 側の `data/verify_solver_catalog.py` が検査する。手で編集しない
- `tengi.js` — 転義表の生成と参照（正規化・グループ化・調名付け）
- `index.html` — UI
- `test/core.test.js` — 単体テスト
- `test/tengi.test.js` — 転義表の単体テスト
- `test/golden.json` / `test/golden.test.js` — HANDOFF.mdの検算例から抽出したリグレッションテスト
