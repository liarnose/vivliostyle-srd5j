const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const manuscriptRoot = path.join(repoRoot, 'SRD5J');
const outputRoot = path.join(repoRoot, 'dist');
const configPath = path.join(repoRoot, 'vivliostyle.config.js');
const cliPath = require.resolve('@vivliostyle/cli/dist/cli.js');

async function collectMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectMarkdownFiles(entryPath);
      }
      if (
        entry.isFile() &&
        path.extname(entry.name).toLowerCase() === '.md' &&
        entry.name.toLowerCase() !== 'readme.md'
      ) {
        return [entryPath];
      }
      return [];
    }),
  );
  return files.flat().sort((left, right) => left.localeCompare(right));
}

function toOutputPath(sourcePath) {
  const relativePath = path.relative(manuscriptRoot, sourcePath);
  return path.join(outputRoot, relativePath.replace(/\.md$/i, '.pdf'));
}

async function resolveBuildSource(sourcePath) {
  return sourcePath;
}

async function runVivliostyle(sourcePath, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const title = path.basename(sourcePath, path.extname(sourcePath));
  const args = [
    cliPath,
    'build',
    sourcePath,
    '--config',
    configPath,
    '--output',
    outputPath,
    '--title',
    title,
  ];

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: repoRoot,
      stdio: 'inherit',
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`vivliostyle build failed for ${sourcePath} with exit code ${code}`));
    });
    child.on('error', reject);
  });
}

async function main() {
  const markdownFiles = await collectMarkdownFiles(manuscriptRoot);
  if (markdownFiles.length === 0) {
    throw new Error('No Markdown files found in SRD5J.');
  }

  for (const sourcePath of markdownFiles) {
    const buildSource = await resolveBuildSource(sourcePath);
    const outputPath = toOutputPath(sourcePath);
    console.log(`Building ${path.relative(repoRoot, sourcePath)} -> ${path.relative(repoRoot, outputPath)}`);
    await runVivliostyle(buildSource, outputPath);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
