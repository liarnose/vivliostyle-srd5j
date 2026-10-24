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

- `SRD5J/` 配下のすべての `.md` ファイルを探索します（`.git`、`node_modules`、隠しディレクトリは除外）
- `SRD5J/` ルート直下の `.md` はファイルごとに PDF 化します
- サブディレクトリ内の `.md` はディレクトリ単位でファイル名順に結合し、1つの PDF を出力します
- 出力先は `dist/` です
- ビルド時に Vivliostyle のテーマ用ワークスペース（`.vivliostyle/themes`）を自動準備します

例:

- `SRD5J/AlignmentJ.md` → `dist/AlignmentJ.pdf`
- `SRD5J/02-ClassesJ/*.md` → ファイル名順に結合して `dist/02-ClassesJ.pdf`

## 構成

- `vivliostyle.base.config.js`: 共通の組版設定
- `scripts/build-pdfs.js`: 対象 Markdown の収集、前処理、PDF 出力処理
- `scripts/manuscript-patches/`: 原稿に適用するビルド時パッチ

`scripts/build-pdfs.js` は次の順序で処理します。

1. `SRD5J/` を `.vivliostyle/manuscript` にコピー
2. 見出し前の空行補正と `scripts/manuscript-patches/` のパッチ適用
3. `vivliostyle-theme-spellbook-5e` 向けの拡張記法を反映して HTML を生成
4. Vivliostyle CLI で PDF を生成

## GitHub Actions での PDF リリース

`.github/workflows/build-pdf.yml` で `workflow_dispatch` を提供しています。手動実行時に `srd5j_ref`（ブランチ・タグ・コミット）を指定できます。未指定時は `main` を使用します。

- `npm ci` と `npm run build` を実行
- `dist/` を `pdfs-dist.zip` にまとめる
- `dist/**/*.pdf` と `pdfs-dist.zip` を成果物として公開
- Release タグを `pdf-srd5j-<短縮コミット>-generator-<package.json の version>` 形式で自動生成

例: SRD5J の短縮コミットが `45025ae` で生成ツールのバージョンが `1.0.0` の場合、Release タグは `pdf-srd5j-45025ae-generator-1.0.0` になります。
