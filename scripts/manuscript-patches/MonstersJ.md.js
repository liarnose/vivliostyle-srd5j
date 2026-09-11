module.exports = (markdown) =>
	markdown
		.replace(/^##ドラゴン$/m, '## ドラゴン')
		.replace(/^##### デーモン$/m, '## デーモン')
		.replace(/^##### 伝説的アクション$/gm, '###### 伝説的アクション');
