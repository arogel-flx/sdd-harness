import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import fs from 'fs-extra';

vi.mock('../../utils/exec.js', () => ({
  exec: vi.fn(() => ''),
  execSilent: vi.fn(() => ''),
}));

import { describeAppEntry, generateSDD } from '../sdd.generator.js';

// F1: una app registrada con path fuera de apps/ conserva el id lógico apps/<name> en los
// registros (los schemas lo exigen) y deja escrito dónde vive el código, en global.json y en
// la constitución del subproyecto.
describe('sdd.generator — apps cuyo código no vive en apps/<name>', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(resolve(tmpdir(), 'harness-sdd-apps-path-'));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('describeAppEntry: id lógico apps/<name>, path real cuando difiere', () => {
    expect(describeAppEntry({ name: 'web', type: 'react' }, 'nx')).toBe('apps/web — react');
    expect(describeAppEntry({ name: 'web', type: 'react', path: 'apps/web' }, 'nx')).toBe('apps/web — react');
    expect(describeAppEntry({ name: 'api', type: 'springboot', path: 'src/api' }, 'nx')).toBe(
      'src/api — springboot (código en src/api; id lógico apps/api)',
    );
    expect(describeAppEntry({ name: 'solo', type: 'app', path: 'src/solo' }, 'standalone')).toBe(
      '. — app (standalone: código en la raíz del repo)',
    );
  });

  it('global.json y el contexto registran el path real; apps/<name> sigue siendo la clave', async () => {
    await generateSDD(
      root,
      {
        projectName: 'meta-repo',
        description: 'Apps under src/.',
        packageScope: '@meta-repo',
        apps: [
          { name: 'api', type: 'springboot', path: 'src/api' },
          { name: 'web', type: 'react' },
        ],
        libs: [],
        services: [],
      },
      { layout: 'nx', mergePackageJson: true },
    );

    const global = await fs.readJSON(resolve(root, 'sdd/global.json'));
    expect(global.monorepo.apps).toEqual({
      api: 'src/api — springboot (código en src/api; id lógico apps/api)',
      web: 'apps/web — react',
    });

    // el contexto vive bajo el id lógico, no bajo el path físico
    expect(await fs.pathExists(resolve(root, 'sdd/context/apps/api/constitution.md'))).toBe(true);
    expect(await fs.pathExists(resolve(root, 'sdd/context/src'))).toBe(false);

    const apiConstitution = await fs.readFile(resolve(root, 'sdd/context/apps/api/constitution.md'), 'utf-8');
    expect(apiConstitution).toContain('vive en `src/api/`');
    const webConstitution = await fs.readFile(resolve(root, 'sdd/context/apps/web/constitution.md'), 'utf-8');
    expect(webConstitution).not.toContain('Ubicación');
  });
});
