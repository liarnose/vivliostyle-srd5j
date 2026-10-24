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

- `SRD5J/` 配下のすべての `.md` ファイルを動的に探索します
- サブフォルダ内の `.md` はファイル名順に結合し、フォルダ名をタイトルにした A4 PDF にします
- `SRD5J/` ルート直下の `.md` は従来どおりファイルごとに A4 PDF 化します
- 出力先は `dist/` です
- フォルダ内の原稿をまとめた PDF はフォルダ名で `dist/` 直下に出力します
- ビルド時に Vivliostyle のテーマ用ワークスペースも自動準備します

例:

- `SRD5J/AlignmentJ.md` → `dist/AlignmentJ.pdf`
- `SRD5J/02-ClassesJ/*.md` → ファイル名順に結合して `dist/02-ClassesJ.pdf`

## 構成

- `vivliostyle.base.config.js`: 共通の組版設定
- `scripts/build-pdfs.js`: 対象 Markdown の収集と PDF 出力処理

`scripts/build-pdfs.js` は `vivliostyle-theme-spellbook-5e` 向けの拡張記法を反映する前処理を行ってから組版します。

## PDFリリースの運用案

SRD5Jの更新頻度が高いため、将来的にはGitHub Actionsの `workflow_dispatch` を使って、必要なときだけPDFリリースを手動実行する。

- Actionsの入力は、SRD5Jのブランチ、タグ、またはコミットハッシュを指定する `srd5j_ref` のみとする
- `srd5j_ref` のデフォルトは `main` とする
- Actions実行時に指定されたSRD5Jを取得してから `npm run build` を実行する
- 実際にビルドへ使用したSRD5Jのコミットを `git -C SRD5J rev-parse --short HEAD` で取得する
- GitHub Releaseのタグは `pdf-srd5j-<短縮コミットハッシュ>-generator-<生成ツールバージョン>` として自動生成する
- PDFと `dist/` のZIPを、そのReleaseに添付する

例えばSRD5Jのコミットが `45025ae` の場合、Releaseタグは次のようになる。

```text
pdf-srd5j-45025ae-generator-1.0.0
```

生成ツールバージョンは、このリポジトリの `package.json` にある `version` を使用する。Actionsでは次のように取得してタグへ組み込む。

```yaml
- name: Get release metadata
  id: metadata
  run: |
    srd5j_commit=$(git -C SRD5J rev-parse --short HEAD)
    generator_version=$(node -p "require('./package.json').version")
    echo "srd5j_commit=$srd5j_commit" >> "$GITHUB_OUTPUT"
    echo "generator_version=$generator_version" >> "$GITHUB_OUTPUT"

- name: Create GitHub Release
  uses: softprops/action-gh-release@v2
  with:
    tag_name: pdf-srd5j-${{ steps.metadata.outputs.srd5j_commit }}-generator-${{ steps.metadata.outputs.generator_version }}
```

Releaseタグを入力項目にせず自動生成することで、Release名と実際の成果物のソースおよび生成ツール版を一致させる。同じSRD5Jコミットと生成ツールバージョンで再実行した場合は同じReleaseを更新する。Actionsのworkflowファイル追加は今後行う。
