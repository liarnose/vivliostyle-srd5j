/**
 * Markdown原稿をVivliostyleでの組版前に処理し、
 * vivliostyle-theme-spellbook-5e独自のRaw HTML構文を自動付与したHTMLへ変換する。
 *
 * @vivliostyle/vfm の `editPlugins` フックでmdastPlugins末尾へ独自プラグインを追加し、
 * remark-parse → (VFM標準のmdast変換群) → 独自変換 → remark-rehype → rehype-stringify
 * という一本のunifiedパイプラインの中でRaw HTMLノードを注入する。
 * markdown文字列への逆変換(stringify)は行わないため、VFM独自構文(ルビ・脚注等)の
 * 再シリアライズによる破損リスクを避けられる。
 */
import { VFM, readMetadata } from '@vivliostyle/vfm';
import {
  remarkSb5eCreatureBlocks,
  remarkSb5eDropcap,
  remarkSb5eFlattenCreatureArticles,
  remarkSb5ePagebreakMarker,
} from './sb5e-plugins.mjs';

/**
 * @param {string} markdownString
 * @returns {string} テーマ独自のRaw HTMLを注入済みのHTML文字列
 */
export function renderMarkdown(markdownString) {
  const metadata = readMetadata(markdownString);
  const processor = VFM(
    {
      // 独自プラグインは組み込みのsectionize(見出しのsection化)より前段で
      // Raw HTMLノードを注入する必要があるため、mdastPluginsの先頭に追加する。
      editPlugins: (plugins) => ({
        ...plugins,
        mdastPlugins: [
          remarkSb5ePagebreakMarker,
          remarkSb5eCreatureBlocks,
          remarkSb5eDropcap,
          ...plugins.mdastPlugins,
          remarkSb5eFlattenCreatureArticles,
        ],
      }),
    },
    metadata,
  );
  return String(processor.processSync(markdownString));
}
