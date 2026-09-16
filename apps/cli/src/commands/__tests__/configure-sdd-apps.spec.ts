import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import fs from 'fs-extra';

import {
  describeApp,
  discoverNxApplications,
  parseAppsFlag,
} from '../configure/sdd-apps.js';

// F1 (2026-09-16): un repo con nx.json y las apps en src/<name>/project.json instalaba el kit
// con monorepo.apps = {} y sin aviso. Ahora se descubren fuera de apps/ o se declaran con --apps.
describe('configure sdd: qué apps registra', () => {
  let root: string;

  beforeEach(async () => {
    root = mkdtempSync(resolve(tmpdir(), 'harness-configure-apps-'));
    await fs.writeJSON(resolve(root, 'nx.json'), {});
    // layout clásico
    await fs.ensureDir(resolve(root, 'apps/legacy'));
    await fs.writeFile(resolve(root, 'apps/legacy/nest-cli.json'), '{}');
    // apps fuera de apps/
    await fs.ensureDir(resolve(root, 'src/api'));
    await fs.writeJSON(resolve(root, 'src/api/project.json'), { name: 'api', projectType: 'application' });
    await fs.writeFile(resolve(root, 'src/api/pom.xml'), '<project/>');
    await fs.ensureDir(resolve(root, 'src/shared'));
    await fs.writeJSON(resolve(root, 'src/shared/project.json'), { name: 'shared', projectType: 'library' });
    // ruido que nunca debe registrarse
    await fs.ensureDir(resolve(root, 'node_modules/dep'));
    await fs.writeJSON(resolve(root, 'node_modules/dep/project.json'), { name: 'dep', projectType: 'application' });
    await fs.ensureDir(resolve(root, 'sdd/templates/apps/java-api'));
    await fs.writeJSON(resolve(root, 'sdd/templates/apps/java-api/project.json'), { name: 'example-api', projectType: 'application' });
    // un workspace anidado: su project.json raíz es hoja, no se baja a sus apps
    await fs.ensureDir(resolve(root, 'src/mfe/apps/inner'));
    await fs.writeJSON(resolve(root, 'src/mfe/project.json'), { name: 'mfe', projectType: 'application' });
    await fs.writeJSON(resolve(root, 'src/mfe/apps/inner/project.json'), { name: 'inner', projectType: 'application' });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('descubre apps/ y los project.json de tipo application fuera de apps/, con su path real', () => {
    const apps = discoverNxApplications(root);
    expect(apps).toEqual([
      { name: 'legacy', type: 'nestjs', path: 'apps/legacy' },
      { name: 'api', type: 'springboot', path: 'src/api' },
      { name: 'mfe', type: 'app', path: 'src/mfe' },
    ]);
    // ni la lib, ni node_modules, ni los blueprints del kit, ni las apps del workspace anidado
    const names = apps.map((a) => a.name);
    expect(names).not.toContain('shared');
    expect(names).not.toContain('dep');
    expect(names).not.toContain('example-api');
    expect(names).not.toContain('inner');
  });

  it('un monorepo sin apps devuelve vacío (el comando lo convierte en error, no en kit vacío)', async () => {
    const empty = mkdtempSync(resolve(tmpdir(), 'harness-configure-empty-'));
    await fs.writeJSON(resolve(empty, 'nx.json'), {});
    await fs.ensureDir(resolve(empty, 'src/whatever'));
    expect(discoverNxApplications(empty)).toEqual([]);
    rmSync(empty, { recursive: true, force: true });
  });

  it('--apps name=path registra exactamente lo declarado, con tipo por marcadores', () => {
    expect(parseAppsFlag('api=src/api, legacy=apps/legacy/', root)).toEqual([
      { name: 'api', type: 'springboot', path: 'src/api' },
      { name: 'legacy', type: 'nestjs', path: 'apps/legacy' },
    ]);
  });

  it('--apps rechaza formatos rotos, duplicados, paths inexistentes y paths fuera del repo', () => {
    expect(() => parseAppsFlag('api', root)).toThrow(/expected name=path/);
    expect(() => parseAppsFlag('=src/api', root)).toThrow(/expected name=path/);
    expect(() => parseAppsFlag('api=', root)).toThrow(/expected name=path/);
    expect(() => parseAppsFlag('api=src/api,api=src/api', root)).toThrow(/listed twice/);
    expect(() => parseAppsFlag('ghost=src/ghost', root)).toThrow(/not a directory/);
    expect(() => parseAppsFlag('up=../outside', root)).toThrow(/inside the repo/);
    expect(() => parseAppsFlag('me=.', root)).toThrow(/inside the repo/);
    expect(() => parseAppsFlag('bad name=src/api', root)).toThrow(/not a valid app name/);
    expect(() => parseAppsFlag(' , ', root)).toThrow(/at least one/);
  });

  it('describeApp muestra el path solo cuando no es apps/<name>', () => {
    expect(describeApp({ name: 'legacy', type: 'nestjs', path: 'apps/legacy' })).toBe('legacy (nestjs)');
    expect(describeApp({ name: 'api', type: 'springboot', path: 'src/api' })).toBe('api (springboot @ src/api)');
    expect(describeApp({ name: 'solo', type: 'app' })).toBe('solo (app)');
  });
});
