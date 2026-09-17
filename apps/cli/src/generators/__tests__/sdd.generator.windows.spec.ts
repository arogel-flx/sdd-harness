import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync, lstatSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import fs from 'fs-extra';

import { generateSDD } from '../sdd.generator.js';

// Integración real en Windows: sin mock de exec, setup-agents.ps1 corre de verdad bajo
// Windows PowerShell 5.1, que es lo que ejecuta `pnpm setup:agents`. Hasta v0.14.1 nada de la
// suite ejecutaba el .ps1, y así sobrevivió un root mal calculado que dejaba la raíz sin
// AGENTS.md/CLAUDE.md. Cada caso arma su propio estado inicial.
const ROOT_FILES = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md'];

const runSetupAgents = (root: string) =>
  spawnSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'sdd/scripts/setup-agents.ps1'],
    { cwd: root, encoding: 'utf-8', env: { ...process.env, SDD_RTK_SKIP_INSTALL: '1' } },
  );

const isLink = (path: string) => {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
};

const hasGit = spawnSync('git', ['--version'], { encoding: 'utf-8' }).status === 0;

const OPTS = {
  projectName: 'win-repo',
  description: 'Existing Windows repo.',
  packageScope: '@win-repo',
  apps: [{ name: 'win-repo', type: 'app' }],
  libs: [],
  services: [],
};
const INSTALL = { layout: 'standalone' as const, mergePackageJson: true, absorbExistingHarness: true };

describe.skipIf(process.platform !== 'win32')('setup-agents.ps1 (integration, Windows)', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(resolve(tmpdir(), 'harness-win-'));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('configure sdd links the root files and merges .gemini/settings.json without clobbering shapes', async () => {
    await fs.writeFile(resolve(root, 'CLAUDE.md'), '# Team rules\n\nkeep me\n', 'utf-8');
    const settings = {
      theme: 'dark',
      exclude: [],
      includeDirectories: ['packages'],
      mcpServers: { a: { command: 'x', args: ['mcp'] } },
      context: { fileName: ['MYRULES.md'] },
    };
    await fs.outputJSON(resolve(root, '.gemini/settings.json'), settings);

    await generateSDD(root, OPTS, INSTALL);

    for (const file of ROOT_FILES) {
      const stat = lstatSync(resolve(root, file));
      expect(stat.isSymbolicLink() || stat.isFile(), `${file} exists`).toBe(true);
      expect(await fs.pathExists(resolve(root, `${file}.new`)), `${file}.new`).toBe(false);
    }
    // el texto del equipo viajó: se lee a través del link (o de la copia)
    expect(await fs.readFile(resolve(root, 'CLAUDE.md'), 'utf-8')).toContain('keep me');
    // nada quedó bajo la raíz equivocada
    expect(await fs.pathExists(resolve(root, 'sdd/.claude'))).toBe(false);
    expect(await fs.pathExists(resolve(root, '.claude/agents'))).toBe(true);

    // Sin BOM: setup-rtk.mjs (Node) tiene que poder parsearlo y sumar el hook de Gemini.
    // Set-Content -Encoding UTF8 en PowerShell 5.1 escribía BOM y JSON.parse lo rechazaba.
    const rawSettings = await fs.readFile(resolve(root, '.gemini/settings.json'), 'utf-8');
    expect(rawSettings.charCodeAt(0), 'settings.json must not start with a BOM').not.toBe(0xfeff);
    const merged = JSON.parse(rawSettings);
    expect(merged.hooks?.BeforeTool, 'gemini rtk hook merged by setup-rtk').toBeDefined();
    const toml = await fs.readFile(
      resolve(root, '.gemini/commands/start-sdd-cycle.toml'),
      'utf-8',
    );
    expect(toml.charCodeAt(0), 'generated toml must not start with a BOM').not.toBe(0xfeff);
    expect(merged.theme).toBe('dark');
    expect(merged.exclude).toEqual([]);
    expect(merged.includeDirectories).toEqual(['packages']);
    expect(merged.mcpServers).toEqual({ a: { command: 'x', args: ['mcp'] } });
    expect(merged.context.fileName).toEqual(['MYRULES.md', 'GEMINI.md', 'AGENTS.md']);
  });

  it('a dangling link into sdd/ is pruned and the script still exits 0', async () => {
    await generateSDD(root, OPTS, INSTALL);
    // un link de directorio a algo que ya no existe (lo que queda al resolver un *.new)
    const gone = resolve(root, 'sdd/skills/gone-skill');
    await fs.ensureDir(gone);
    const link = resolve(root, '.github/skills/gone-skill');
    const mk = spawnSync('cmd', ['/c', 'mklink', '/J', link, gone], { encoding: 'utf-8' });
    expect(mk.status, mk.stderr).toBe(0);
    await fs.remove(gone);

    const result = runSetupAgents(root);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain('pruned dangling');
    expect(await fs.pathExists(link)).toBe(false);
    expect(lstatSync(resolve(root, 'CLAUDE.md'))).toBeTruthy();
  });

  it('a root file that is a copy of the kit file becomes a link and leaves no .new', async () => {
    await generateSDD(root, OPTS, INSTALL);
    const target = resolve(root, 'CLAUDE.md');
    // simular el fallback: la raíz quedó como copia real del dual-harness
    await fs.remove(target);
    await fs.copy(resolve(root, 'sdd/dual-harness/CLAUDE.md'), target);
    expect(isLink(target)).toBe(false);

    const result = runSetupAgents(root);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toMatch(/replaced copy\s+: CLAUDE\.md/);
    expect(await fs.pathExists(`${target}.new`)).toBe(false);
    const stat = lstatSync(target);
    // symlink con Modo de desarrollador; hardlink cuando el runner no puede crear symlinks
    expect(stat.isSymbolicLink() || stat.isFile()).toBe(true);
    expect(await fs.readFile(target, 'utf-8')).toBe(
      await fs.readFile(resolve(root, 'sdd/dual-harness/CLAUDE.md'), 'utf-8'),
    );
  });

  it('configure sdd twice does not grow sdd/dual-harness', async () => {
    await fs.writeFile(resolve(root, 'AGENTS.md'), '# Team rules\n\nnever touch prod\n', 'utf-8');
    await generateSDD(root, OPTS, INSTALL);
    await generateSDD(root, OPTS, INSTALL);
    const dual = await fs.readFile(resolve(root, 'sdd/dual-harness/AGENTS.md'), 'utf-8');
    expect(dual.split('Instrucciones previas del proyecto').length - 1).toBe(1);
    expect(dual.split('never touch prod').length - 1).toBe(1);
  });

  it('a repo path with # and a space still gets links that resolve', async () => {
    const odd = resolve(root, 'C# and space');
    await fs.ensureDir(odd);
    await fs.writeFile(resolve(odd, 'CLAUDE.md'), '# odd path\n', 'utf-8');

    await generateSDD(odd, OPTS, INSTALL);

    for (const file of ROOT_FILES) {
      // leer a través del link: si el target relativo estuviera roto, esto tira ENOENT
      const viaLink = await fs.readFile(resolve(odd, file), 'utf-8');
      const source = await fs.readFile(resolve(odd, 'sdd/dual-harness', file), 'utf-8');
      expect(viaLink).toBe(source);
    }
    const agentsViaLink = await fs.readdir(resolve(odd, '.claude/agents'));
    expect(agentsViaLink.length).toBeGreaterThan(0);
  });

  it('an invalid package.json fails configure sdd but leaves the original root files', async () => {
    const original = '# Team rules\n\nkeep me\n';
    await fs.writeFile(resolve(root, 'CLAUDE.md'), original, 'utf-8');
    await fs.writeFile(resolve(root, 'package.json'), '{ not json', 'utf-8');

    await expect(generateSDD(root, OPTS, INSTALL)).rejects.toThrow();
    expect(await fs.readFile(resolve(root, 'CLAUDE.md'), 'utf-8')).toBe(original);
  });

  it.skipIf(!hasGit)('re-running setup:agents on a checkout Git already wired leaves git status clean', async () => {
    await generateSDD(root, OPTS, INSTALL);
    if (!isLink(resolve(root, 'CLAUDE.md'))) {
      // sin Modo de desarrollador no hay symlinks: el caso no aplica en este runner
      return;
    }
    const git = (...args: string[]) =>
      execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...args], {
        cwd: root,
        encoding: 'utf-8',
      });
    git('init', '-q');
    git('config', 'core.symlinks', 'true');
    git('config', 'core.longpaths', 'true');
    git('add', '-A');
    git('commit', '-qm', 'wired');

    const result = runSetupAgents(root);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).not.toMatch(/refreshed|replaced|created/);
    expect(git('status', '--porcelain').trim()).toBe('');
  });
});
