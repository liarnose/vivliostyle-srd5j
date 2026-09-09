# vivliostyle-srd5j

`paladin-nekohaus/SRD5J` に含まれる Markdown 原稿を、`@liarnose/vivliostyle-theme-spellbook-5e` と `@vivliostyle/cli` を使って A4 PDF として組版するプロジェクトです。

## セットアップ

```bash
git submodule update --init --recursive
npm install
```

SRD5J は `SRD5J/` に Git サブモジュールとして追加してあり、`.gitmodules` で `ignore = dirty` を設定しています。

## PDF の生成

```bash
npm run build
```

- `SRD5J/` 配下の `README.md` を除くすべての `.md` ファイルを動的に探索します
- 各 Markdown ファイルを個別に A4 PDF 化します
- 出力先は `dist/` です
- PDF の配置は `SRD5J/` 配下の相対パスを維持します

例:

- `SRD5J/AlignmentJ.md` → `dist/AlignmentJ.pdf`
- `SRD5J/ClassesJ/BarbarianJ.md` → `dist/ClassesJ/BarbarianJ.pdf`

## 構成

- `vivliostyle.config.js`: 共通の組版設定
- `scripts/build-pdfs.js`: 対象 Markdown の収集と PDF 出力処理

`scripts/build-pdfs.js` は現在そのまま Markdown を組版しますが、今後 `vivliostyle-theme-spellbook-5e` 向けの拡張記法を反映する前処理パイプラインを追加しやすい構成にしています。
