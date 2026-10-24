module.exports = (markdown) =>
    markdown.replace(/^\*(魔法の武器|精神遮蔽|日光過敏|魔法抵抗):\*\*/gm, '**$1:**');
