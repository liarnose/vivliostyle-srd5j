module.exports = (markdown) =>
	markdown.replace(
		/^# ウォーロック\s*\n\s*\| レベル \|/m,
		'# ウォーロック\n\n**ウォーロック**\n\n| レベル |',
	);
