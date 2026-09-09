const path = require('node:path');

module.exports = {
  language: 'ja',
  size: 'A4',
  theme: [
    '@liarnose/vivliostyle-theme-spellbook-5e',
    path.join(__dirname, 'styles', 'override.css'),
  ],
  workspaceDir: '.vivliostyle',
};
