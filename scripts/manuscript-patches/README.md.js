module.exports = (markdown) =>
    markdown.replace(/^(#{1,5})([ \t]+.*)$/gm, (line, hashes, title) =>
        line === '# SRD5J' ? line : `#${hashes}${title}`,
    );
