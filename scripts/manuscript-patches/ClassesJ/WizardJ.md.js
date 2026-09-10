// SRD5J/ClassesJ/WizardJ.md のレベル表は20行×13列あり、1ページに収まらず複数ページに分割される際に
// Vivliostyleのページネーションが無限ループしてビルドがハングする。
// ヘッダー行の複製を挟んで1-10レベルと11-20レベルの2つの表に分割することで回避する。
module.exports = function patchWizardJ(content) {
    const brokenHeader =
        '|レベル|習熟ボーナス|特徴|初級呪文の修得数|1|2|3|4|5|6|7|8|9|\n' +
        '|:-:|:-:|:-|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|\n';
    const fixedHeader =
        '|レベル|習熟ボーナス|特徴|初級呪文の修得数|1|2|3|4|5|6|7|8|9|\n' +
        '|:-:|:-:|:-|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|\n';

    if (!content.includes(brokenHeader)) {
        throw new Error('WizardJ.md patch target not found; the upstream content may have changed.');
    }

    const splitMarker = '|10|+4|秘術の学派の特徴|5|4|3|3|3|2|─|─|─|─|\n';
    const splitIndex = content.indexOf(splitMarker);
    if (splitIndex === -1) {
        throw new Error('WizardJ.md patch split point not found; the upstream content may have changed.');
    }
    const insertAt = splitIndex + splitMarker.length;

    return (
        content.slice(0, insertAt).replace(brokenHeader, fixedHeader) +
        '\n' +
        fixedHeader +
        content.slice(insertAt).replace(brokenHeader, fixedHeader)
    );
};
