import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import fs from 'fs-extra';

// setup-agents is mocked away: this is the "script could not link anything" scenario
// (no symlink rights, wrong shell, the v0.14.1 wrong-root bug on Windows).
vi.mock('../../utils/exec.js', () => ({
  exec: vi.fn(() => {
    throw new Error('Command failed: setup-agents');
  }),
  execSilent: vi.fn(() => ''),
}));

import { ensureRootHarnessFiles, generateSDD } from '../sdd.generator.js';

describe('sdd.generator — root instruction files survive a failed setup-agents', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(resolve(tmpdir(), 'harness-sdd-rootfiles-'));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('configure sdd never leaves the repo without AGENTS.md/CLAUDE.md/GEMINI.md', async () => {
    await fs.writeFile(resolve(root, 'CLAUDE.md'), '# Notas Claude\n\nNo tocar legacy/.\n', 'utf-8');

    await generateSDD(
      root,
      {
        projectName: 'legacy-repo',
        description: 'Existing repo, linking failed.',
        packageScope: '@legacy-repo',
        apps: [{ name: 'legacy-repo', type: 'app' }],
        libs: [],
        services: [],
      },
      { layout: 'standalone', mergePackageJson: true, absorbExistingHarness: true },
    );

    for (const file of ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md']) {
      const stat = await fs.lstat(resolve(root, file));
      expect(stat.isFile(), `${file} must exist as a real copy`).toBe(true);
    }
    // The absorbed content travelled into the copy, so nothing the team wrote is lost.
    const claude = await fs.readFile(resolve(root, 'CLAUDE.md'), 'utf-8');
    expect(claude).toContain('No tocar legacy/.');
    expect(claude).toContain('Instrucciones previas del proyecto');
  });

  it('a second configure sdd does not nest the kit inside itself', async () => {
    await fs.writeFile(resolve(root, 'AGENTS.md'), '# Team rules\n\nnever touch prod\n', 'utf-8');
    const opts = {
      projectName: 'legacy-repo',
      description: 'Existing repo, linking failed twice.',
      packageScope: '@legacy-repo',
      apps: [{ name: 'legacy-repo', type: 'app' }],
      libs: [],
      services: [],
    };
    const install = { layout: 'standalone' as const, mergePackageJson: true, absorbExistingHarness: true };

    await generateSDD(root, opts, install);
    // linking failed: the root file is a real copy of the kit's dual-harness file
    const afterFirst = await fs.readFile(resolve(root, 'AGENTS.md'), 'utf-8');
    expect(afterFirst).toBe(await fs.readFile(resolve(root, 'sdd/dual-harness/AGENTS.md'), 'utf-8'));

    await generateSDD(root, opts, install);
    const dual = await fs.readFile(resolve(root, 'sdd/dual-harness/AGENTS.md'), 'utf-8');
    expect(dual.split('Instrucciones previas del proyecto').length - 1).toBe(1);
    expect(dual.split('never touch prod').length - 1).toBe(1);
    // the kit's own header appears once: the copy was not absorbed as if it were the team's text
    expect(dual.split('# AGENTS.md').length - 1).toBeLessThanOrEqual(1);
  });

  it('a failure before linking leaves the original root file untouched', async () => {
    const original = '# Notas Claude\n\nNo tocar legacy/.\n';
    await fs.writeFile(resolve(root, 'CLAUDE.md'), original, 'utf-8');
    await fs.writeFile(resolve(root, 'package.json'), '{ not json', 'utf-8');

    await expect(
      generateSDD(
        root,
        {
          projectName: 'legacy-repo',
          description: 'Broken package.json.',
          packageScope: '@legacy-repo',
          apps: [{ name: 'legacy-repo', type: 'app' }],
          libs: [],
          services: [],
        },
        { layout: 'standalone', mergePackageJson: true, absorbExistingHarness: true },
      ),
    ).rejects.toThrow();

    expect(await fs.readFile(resolve(root, 'CLAUDE.md'), 'utf-8')).toBe(original);
  });

  it('ensureRootHarnessFiles leaves an existing link or file alone', async () => {
    await fs.ensureDir(resolve(root, 'sdd/dual-harness'));
    await fs.writeFile(resolve(root, 'sdd/dual-harness/AGENTS.md'), 'kit', 'utf-8');
    await fs.writeFile(resolve(root, 'sdd/dual-harness/CLAUDE.md'), 'kit', 'utf-8');
    await fs.writeFile(resolve(root, 'AGENTS.md'), 'mine', 'utf-8');

    await ensureRootHarnessFiles(root, true);

    expect(await fs.readFile(resolve(root, 'AGENTS.md'), 'utf-8')).toBe('mine');
    expect(await fs.readFile(resolve(root, 'CLAUDE.md'), 'utf-8')).toBe('kit');
    // no GEMINI.md in dual-harness → nothing to copy, and no error
    expect(await fs.pathExists(resolve(root, 'GEMINI.md'))).toBe(false);
  });
});
