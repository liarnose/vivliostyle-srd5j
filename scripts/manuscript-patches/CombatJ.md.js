const licenseText = `

# ライセンス

注記があるものを除き、このぱらでぃんによる“System Reference Document 5.1 日本語版(“SRD 5.1j”)”はクリエイティブ・コモンズ 表示 4.0(Creative Commons Attribution 4.0 International)の下に提供されています。次のように出典を表記することで自由に二次利用が可能なライセンスです。例:「この文書にはぱらでぃんによる“System Reference Document 5.1 日本語版(“SRD 5.1j”)”が含まれています」

This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.
`;

module.exports = (markdown) => `${markdown.trimEnd()}${licenseText}`;
