const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { ensureFontAliases } = require('./setup-theme-font-aliases');

const repoRoot = path.resolve(__dirname, '..');
const manuscriptRoot = path.join(repoRoot, 'SRD5J');
const outputRoot = path.join(repoRoot, 'dist');
const baseConfigPath = path.join(repoRoot, 'vivliostyle.base.config.js');
const baseConfig = require(baseConfigPath);
const packageJson = require(path.join(repoRoot, 'package.json'));
const cliPath = path.join(
  repoRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'vivliostyle.cmd' : 'vivliostyle',
);
const npmPath = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const themePackageName = '@liarnose/vivliostyle-theme-spellbook-5e';
const timeoutSeconds = 1800;

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} failed with exit code ${code}`));
    });
    child.on('error', reject);
  });
}

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

async function createBuildConfig(sourcePath, outputPath) {
  const relativePath = path.relative(manuscriptRoot, sourcePath);
  const title = path.basename(sourcePath, path.extname(sourcePath));
  const config = {
    ...baseConfig,
    title,
    entry: [path.relative(repoRoot, sourcePath)],
    output: path.relative(repoRoot, outputPath),
  };
  const configDir = path.join(repoRoot, '.vivliostyle', 'configs');
  const configPath = path.join(configDir, relativePath.replace(/\.md$/i, '.config.cjs'));
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, `module.exports = ${JSON.stringify(config, null, 2)};\n`);
  return configPath;
}

async function runVivliostyle(sourcePath, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const configPath = await createBuildConfig(sourcePath, outputPath);
  await runCommand(cliPath, ['build', '--config', configPath, '--timeout', String(timeoutSeconds)], repoRoot);
}

async function ensureThemeWorkspace() {
  const workspaceThemeRoot = path.join(repoRoot, '.vivliostyle', 'themes');
  const workspacePackageJsonPath = path.join(workspaceThemeRoot, 'package.json');
  const workspacePackageJson = {
    private: true,
    dependencies: {
      [themePackageName]: packageJson.dependencies[themePackageName],
    },
  };

  await fs.mkdir(workspaceThemeRoot, { recursive: true });
  await fs.writeFile(
    workspacePackageJsonPath,
    `${JSON.stringify(workspacePackageJson, null, 2)}\n`,
  );

  await runCommand(npmPath, ['install', '--no-fund', '--no-audit'], workspaceThemeRoot);
  await ensureFontAliases(path.join(workspaceThemeRoot, 'node_modules', '@fontsource'));
}

async function main() {
  await ensureThemeWorkspace();
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
