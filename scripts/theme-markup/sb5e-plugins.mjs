/**
 * @liarnose/vivliostyle-theme-spellbook-5e 独自のHTML構文をmdast上で自動付与するremarkプラグイン群。
 *
 * @vivliostyle/vfm の `editPlugins` フックで、
 * - クリーチャーブロック検出/ドロップキャップ/改ページ目印の各プラグインはmdastPlugins先頭に、
 * - `remarkSb5eFlattenCreatureArticles`はmdastPlugins末尾(=組み込みのsectionize後)に
 * それぞれ追加される想定。
 *
 * `@vivliostyle/remark-sectionize`(組み込み)は見出しをdepth単位でsectionにラップするが、
 * 常にラップするとは限らず、他の見出し構成との位置関係次第でラップの有無が変わる
 * (isHtmlEnd/isDuplicatedなどの内部ヒューリスティクスに依存)。テーマのCSSは
 * `.sb5e-creature > hr` のような直接子コンビネータに依存しているため、
 * sectionizeがクリーチャーブロック内にsectionを挿入してしまうケースがあると
 * スタイルが適用されなくなる。そこでsectionize実行後にクリーチャーブロックの範囲内だけ
 * sectionノードを展開(アンラップ)し、常にフラットな構造を保証する。
 */

/** クリーチャー統計ブロックの1行目（種別・属性）に使われる斜体段落かどうか。 */
function isCreatureTypeLine(node) {
  return (
    node?.type === 'paragraph' &&
    node.children?.[0]?.type === 'emphasis'
  );
}

/**
 * `#####`(depth5)見出し + 直後の斜体段落、という
 * SRD5J内のクリーチャー/NPCデータブロックの開始位置を検出する。
 */
function isCreatureHeading(node, nextNode) {
  return node.type === 'heading' && node.depth === 5 && isCreatureTypeLine(nextNode);
}

/** 次の見出し(depth5以下)が来たらクリーチャーブロック終端とみなす。 */
function isSectionBoundary(node) {
  return node.type === 'heading' && node.depth <= 5;
}

/**
 * クリーチャー統計ブロックを `<article class="sb5e-creature">` で囲むrawノードを追加する。
 * ルート直下の兄弟ノード列に対してのみ動作する(mdastの見出しは常にルート直下に現れるため)。
 */
export function remarkSb5eCreatureBlocks() {
  return (tree) => {
    const children = tree.children;
    const result = [];
    let i = 0;
    while (i < children.length) {
      const node = children[i];
      if (isCreatureHeading(node, children[i + 1])) {
        let end = i + 1;
        while (end < children.length && !isSectionBoundary(children[end])) {
          end++;
        }
        result.push({ type: 'html', value: '<article class="sb5e-creature">' });
        result.push(...children.slice(i, end));
        result.push({ type: 'html', value: '</article>' });
        i = end;
      } else {
        result.push(node);
        i++;
      }
    }
    tree.children = result;
  };
}

/**
 * 文書内で最初に登場するH1見出しに、直後の段落へドロップキャップを適用する
 * `.sb5e-dropcap-after` クラスを付与する。
 * remark-attrが`{.class}`記法から生成するのと同じ`data.hProperties.className`形式で追加する。
 */
export function remarkSb5eDropcap() {
  return (tree) => {
    const heading = tree.children.find((node) => node.type === 'heading' && node.depth === 1);
    if (!heading) return;

    heading.data ??= {};
    heading.data.hProperties ??= {};
    const existingClassNames = heading.data.hProperties.className ?? [];
    heading.data.hProperties.className = [...existingClassNames, 'sb5e-dropcap-after'];
  };
}

/**
 * `<!--pagebreak-->` というHTMLコメント(著者が手書きする軽量な目印)を
 * テーマの強制改ページ用Raw HTMLへ置き換える。
 */
export function remarkSb5ePagebreakMarker() {
  return (tree) => {
    tree.children = tree.children.map((child) =>
      child.type === 'html' && child.value.trim() === '<!--pagebreak-->'
        ? { type: 'html', value: '<hr style="visibility:hidden;break-after:page;">' }
        : child,
    );
  };
}

const CREATURE_OPEN_TAG = '<article class="sb5e-creature">';
const CREATURE_CLOSE_TAG = '</article>';

function isCreatureOpenTag(node) {
  return node.type === 'html' && node.value.trim() === CREATURE_OPEN_TAG;
}

function isCreatureCloseTag(node) {
  return node.type === 'html' && node.value.trim() === CREATURE_CLOSE_TAG;
}

/** 配列中の`section`ノードをすべて自身の子ノード列で置き換える(再帰的に展開)。 */
function unwrapSections(nodes) {
  const result = [];
  for (const node of nodes) {
    if (node.type === 'section' && Array.isArray(node.children)) {
      result.push(...unwrapSections(node.children));
    } else {
      result.push(node);
    }
  }
  return result;
}

/**
 * sectionize実行後、`<article class="sb5e-creature">`〜`</article>`の範囲内に
 * 生成された`section`ノードを展開し、テーマCSSが前提とするフラットな構造に戻す。
 */
export function remarkSb5eFlattenCreatureArticles() {
  return (tree) => {
    const walk = (node) => {
      if (!Array.isArray(node.children)) return;
      node.children.forEach(walk);

      const children = node.children;
      const result = [];
      let i = 0;
      while (i < children.length) {
        const child = children[i];
        if (isCreatureOpenTag(child)) {
          const closeIndex = children.findIndex(
            (candidate, index) => index > i && isCreatureCloseTag(candidate),
          );
          if (closeIndex !== -1) {
            result.push(child, ...unwrapSections(children.slice(i + 1, closeIndex)), children[closeIndex]);
            i = closeIndex + 1;
            continue;
          }
        }
        result.push(child);
        i++;
      }
      node.children = result;
    };
    walk(tree);
  };
}

