module.exports = (markdown) =>
	markdown.replace(
		/^# ウィザード\s*\n\s*\|レベル\|/m,
		'# ウィザード\n\n**ウィザード**\n\n|レベル|',
	);
