/**
 * 付録MM-Aは、クリーチャー名が `##` 見出しで、区切り線(`---`)も無い。
 * テーマのクリーチャーブロック検出(`#####` + 斜体の種別行)と配色(区切り線の本数)に合わせて、
 * 見出しを `#####` にし、`02-MonstersJ.md` と同じ位置に区切り線を挿入する。
 */
module.exports = (markdown) => {
    const lines = markdown.split('\n');
    const result = [];
    let inCreature = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (/^##[ \t]/.test(line)) {
            inCreature = true;
            result.push(line.replace(/^##/, '#####'));
            continue;
        }
        if (/^#{1,2}[ \t]/.test(line)) {
            inCreature = false;
        }
        result.push(line);
        if (!inCreature) continue;

        const next = lines[i + 1];
        const isTypeLine = /^\*[^*].*\*$/.test(line) && result.at(-2) === '' && /^#####/.test(result.at(-3) ?? '');
        const isSpeed = /^\*\*移動速度:\*\*/.test(line);
        const isChallenge = /^\*\*脅威度:\*\*/.test(line);
        const isAbilityTableEnd = /^\|/.test(line) && !/^\|/.test(next ?? '');

        if (isTypeLine || isSpeed || isChallenge || isAbilityTableEnd) {
            result.push('', '---');
        }
    }

    return result.join('\n');
};
