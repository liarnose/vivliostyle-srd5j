const fs = require('node:fs/promises');
const path = require('node:path');

const aliases = [
  ['yakuhanjp', 'YakuHanJP'],
  ['yakuhanmp', 'YakuHanMP'],
];

async function ensureAlias(fontsourceRoot, sourceName, aliasName) {
  const sourcePath = path.join(fontsourceRoot, sourceName);
  const aliasPath = path.join(fontsourceRoot, aliasName);

  await fs.rm(aliasPath, { recursive: true, force: true });

  const symlinkType = process.platform === 'win32' ? 'junction' : 'dir';
  await fs.symlink(sourcePath, aliasPath, symlinkType);
}

async function main() {
  const [fontsourceRoot] = process.argv.slice(2);
  if (!fontsourceRoot) {
    throw new Error('fontsourceRoot is required');
  }

  for (const [sourceName, aliasName] of aliases) {
    await ensureAlias(fontsourceRoot, sourceName, aliasName);
  }
}

async function ensureFontAliases(fontsourceRoot) {
  for (const [sourceName, aliasName] of aliases) {
    await ensureAlias(fontsourceRoot, sourceName, aliasName);
  }
}

module.exports = { ensureFontAliases };

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
