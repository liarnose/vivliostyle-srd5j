# このリポジトリでの注意事項

## SRD5J/ ディレクトリは編集禁止

`SRD5J/` は git submodule ([paladin-nekohaus/SRD5J](https://github.com/paladin-nekohaus/SRD5J)) であり、このリポジトリの管理外にある外部コンテンツです。

- `SRD5J/` 配下のファイルは**絶対に編集・作成・削除しないでください**。
- 組版エラーの調査や修正が必要な場合でも、`SRD5J/` 内のMarkdownやその他ファイルを直接書き換えてはいけません。代わりに、原因と修正案をユーザーに報告し、修正はユーザー自身が本家リポジトリ側で行ってください。
- `.gitmodules` に `ignore = dirty` が設定されているため、`SRD5J/` 内の変更は親リポジトリの `git status` に表示されません。変更の有無を確認する場合は `cd SRD5J && git status` を使ってください。
- 更新が必要な場合は `git submodule update --remote SRD5J` のようにサブモジュール自体を更新し、内容を直接書き換えないでください。
