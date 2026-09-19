/**
 * @liarnose/vivliostyle-theme-spellbook-5e 独自のHTML構文をmdast上で自動付与するremarkプラグイン群。
 *
 * @vivliostyle/vfm の `editPlugins` フックで、
 * - クリーチャーブロック検出/ドロップキャップ/改ページ目印の各プラグインはmdastPlugins先頭に、
 * - `rehypeSb5eFlattenCreatureArticles`はrehypePlugins末尾(=Raw HTML展開後)に
 * 追加される想定。
 *
 * `@vivliostyle/remark-sectionize`(組み込み)は見出しをdepth単位でsectionにラップするが、
 * 常にラップするとは限らず、他の見出し構成との位置関係次第でラップの有無が変わる
 * (isHtmlEnd/isDuplicatedなどの内部ヒューリスティクスに依存)。テーマのCSSは
 * `.sb5e-creature > hr` のような直接子コンビネータに依存しているため、
 * sectionizeがクリーチャーブロック内にsectionを挿入してしまうケースがあると
 * スタイルが適用されなくなる。そこでHTML化後にクリーチャーブロックを再構成し、
 * 常にフラットな構造を保証する。
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

const WIDE_TABLE_OPEN_TAG = `<div style="
  column-span: all;
  float-reference: page;
  float: top;
  padding: 12q;
  margin-block-end: 24q;
  background-color: rgb(255 255 255 / .6);
  box-shadow: 0 4q 16q rgb(0 0 0 / .2);
">`;
const WIDE_TABLE_CLOSE_TAG = '</div>';

function isWideTable(node) {
  if (node.type !== 'table' || node.children.length < 8) return false;
  const firstRow = node.children[0];
  return firstRow?.type === 'tableRow' && firstRow.children.length >= 3;
}

function isTableCaption(node) {
  return (
    node.type === 'paragraph' &&
    node.children.length === 1 &&
    node.children[0].type === 'strong'
  );
}

/** 3列以上かつ8行以上の表を、キャプションごとテーマの二段抜きレイアウトで囲む。 */
export function remarkSb5eWideTables() {
  return (tree) => {
    const wrapTables = (node) => {
      if (!Array.isArray(node.children)) return;

      const result = [];
      for (const child of node.children) {
        if (isWideTable(child)) {
          const caption = result.at(-1);
          if (caption && isTableCaption(caption)) {
            result.pop();
            result.push(
              { type: 'html', value: WIDE_TABLE_OPEN_TAG },
              caption,
              child,
              { type: 'html', value: WIDE_TABLE_CLOSE_TAG },
            );
            continue;
          }

          result.push(
            { type: 'html', value: WIDE_TABLE_OPEN_TAG },
            child,
            { type: 'html', value: WIDE_TABLE_CLOSE_TAG },
          );
        } else {
          wrapTables(child);
          result.push(child);
        }
      }
      node.children = result;
    };

    wrapTables(tree);
  };
}

function unwrapHastSections(nodes) {
  const result = [];
  for (const node of nodes) {
    if (node.type === 'element' && node.tagName === 'section') {
      result.push(...unwrapHastSections(node.children ?? []));
    } else {
      result.push(node);
    }
  }
  return result;
}

function isWhitespaceText(node) {
  return node.type === 'text' && /^\s*$/.test(node.value);
}

function isCreatureArticle(node) {
  return (
    node.type === 'element' &&
    node.tagName === 'article' &&
    node.properties?.className?.includes('sb5e-creature')
  );
}

function isHastCreatureSection(node) {
  if (
    node.type !== 'element' ||
    node.tagName !== 'section' ||
    !node.properties?.className?.includes('level5')
  ) {
    return false;
  }

  const content = node.children.filter((child) => !isWhitespaceText(child));
  return (
    content[0]?.type === 'element' &&
    content[0].tagName === 'h5' &&
    content[1]?.type === 'element' &&
    content[1].tagName === 'p' &&
    content[1].children?.[0]?.type === 'element' &&
    content[1].children[0].tagName === 'em'
  );
}

function isEmptyCreatureArticle(node) {
  return (
    node.type === 'element' &&
    node.tagName === 'article' &&
    node.properties?.className?.includes('sb5e-creature') &&
    node.children.every(isWhitespaceText)
  );
}

/** HTML化後のクリーチャーブロックをarticleへ再構成し、section要素を展開する。 */
export function rehypeSb5eFlattenCreatureArticles() {
  return (tree) => {
    const walk = (node) => {
      if (!Array.isArray(node.children)) return;
      node.children.forEach(walk);

      if (isCreatureArticle(node)) {
        const creatureSection = node.children.find(isHastCreatureSection);
        if (creatureSection) {
          node.children = unwrapHastSections(creatureSection.children);
        }
      }

      node.children = node.children.flatMap((child) => {
        if (isEmptyCreatureArticle(child)) return [];
        if (!isHastCreatureSection(child)) return [child];

        return [
          {
            type: 'element',
            tagName: 'article',
            properties: { className: ['sb5e-creature'] },
            children: unwrapHastSections(child.children),
          },
        ];
      });
    };
    walk(tree);
  };
}

