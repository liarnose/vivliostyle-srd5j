const fs = require('node:fs/promises');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const fontsourceRoot = path.join(repoRoot, 'node_modules', '@fontsource');

const aliases = [
  ['yakuhanjp', 'YakuHanJP'],
  ['yakuhanmp', 'YakuHanMP'],
];

async function ensureAlias(sourceName, aliasName) {
  const sourcePath = path.join(fontsourceRoot, sourceName);
  const aliasPath = path.join(fontsourceRoot, aliasName);

  await fs.rm(aliasPath, { recursive: true, force: true });

  const symlinkType = process.platform === 'win32' ? 'junction' : 'dir';
  await fs.symlink(sourcePath, aliasPath, symlinkType);
}

async function main() {
  for (const [sourceName, aliasName] of aliases) {
    await ensureAlias(sourceName, aliasName);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
