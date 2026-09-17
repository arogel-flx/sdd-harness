import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import fs from 'fs-extra';

import { generateSDD } from '../sdd.generator.js';
import { updateSDD } from '../update.generator.js';
import { hashContent, normalizeEol } from '../kit-manifest.js';
import { execFileSync } from 'node:child_process';

// apps/cli: de ahí sale el node_modules con ajv que necesita el validador.
const CLI_ROOT = resolve(__dirname, '../../..');

vi.mock('../../utils/exec.js', () => ({
  exec: vi.fn(() => ''),
  execSilent: vi.fn(() => ''),
}));

const toCrlf = async (path: string) => {
  const content = await fs.readFile(path, 'utf-8');
  await fs.writeFile(path, content.replace(/\r?\n/g, '\r\n'), 'utf-8');
};

// Lo que ve un clon Windows con core.autocrlf=true: los archivos del kit en disco tienen CRLF
// aunque el kit los shippeó en LF. Nada de eso es una modificación del usuario.
describe('update.generator — checkout con CRLF', () => {
  let ws: string;

  beforeEach(async () => {
    ws = mkdtempSync(resolve(tmpdir(), 'harness-update-crlf-'));
    await generateSDD(ws, {
      projectName: 'crlf-target',
      description: 'Repo checked out with core.autocrlf=true.',
      packageScope: '@crlf-target',
      apps: [{ name: 'portal', type: 'react' }],
      libs: [],
      services: [],
    });
  });

  afterEach(() => {
    rmSync(ws, { recursive: true, force: true });
  });

  it('normalizeEol pliega CRLF en texto y deja los binarios intactos', () => {
    expect(normalizeEol(Buffer.from('a\r\nb\r\n')).toString()).toBe('a\nb\n');
    expect(normalizeEol(Buffer.from('a\nb\n')).toString()).toBe('a\nb\n');
    // un \r solo (no seguido de \n) no es un fin de línea Windows y se conserva
    expect(normalizeEol(Buffer.from('a\rb')).toString()).toBe('a\rb');
    const binary = Buffer.from([0x00, 0x0d, 0x0a, 0xff]);
    expect(normalizeEol(binary)).toBe(binary);
    expect(hashContent(Buffer.from('x\r\ny\r\n'))).toBe(hashContent(Buffer.from('x\ny\n')));
  });

  it('las claves de kit.json son posix, también en Windows', async () => {
    const manifest = await fs.readJSON(resolve(ws, 'sdd/kit.json'));
    const keys = Object.keys(manifest.files);
    expect(keys.length).toBeGreaterThan(50);
    expect(keys.some((k) => k.includes('\\'))).toBe(false);
    expect(manifest.files['agents/sdd-planner.agent.md']).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.files['scripts/validate-sdd.mjs']).toMatch(/^[a-f0-9]{64}$/);
  });

  it('archivos del kit en CRLF no son "modificados": update no deja .new ni los reemplaza', async () => {
    const files = [
      'sdd/agents/sdd-planner.agent.md',
      'sdd/skills/sdd-reviewer/SKILL.md',
      'sdd/scripts/validate-sdd.mjs',
      'sdd/dual-harness/rules/sdd-gates.md',
    ];
    for (const rel of files) await toCrlf(resolve(ws, rel));
    // y un archivo realmente customizado, también en CRLF, sigue siendo del usuario
    const customized = resolve(ws, 'sdd/agents/sdd-architect.agent.md');
    await fs.appendFile(customized, '\r\n## Regla local del equipo\r\n');

    const report = await updateSDD(ws);

    expect(report.legacyMode).toBe(false);
    expect(report.conflicts).toEqual([]);
    expect(report.updated).toEqual([]);
    expect(report.added).toEqual([]);
    expect(report.keptCustom).toEqual(['agents/sdd-architect.agent.md']);
    // los CRLF quedaron como estaban: el update no reescribió nada que no cambiara
    expect(await fs.readFile(resolve(ws, 'sdd/agents/sdd-planner.agent.md'), 'utf-8')).toContain('\r\n');
    expect(await fs.pathExists(resolve(ws, 'sdd/agents/sdd-planner.agent.md.new'))).toBe(false);
  });
  it('un kit.json con claves backslash (instalación Windows <= 0.14.1) no pierde archivos', async () => {
    // Lo que dejó 0.14.1 en Windows: relative() sin normalizar → claves con "\".
    const manifestPath = resolve(ws, 'sdd/kit.json');
    const manifest = await fs.readJSON(manifestPath);
    const posixKeys = Object.keys(manifest.files);
    manifest.files = Object.fromEntries(
      Object.entries(manifest.files).map(([key, hash]) => [key.split('/').join('\\'), hash]),
    );
    await fs.writeJSON(manifestPath, manifest, { spaces: 2 });
    expect(Object.keys(manifest.files).some((k) => k.includes('\\'))).toBe(true);

    // un archivo del kit modificado por el equipo, para no medir sólo el caso feliz
    const customized = resolve(ws, 'sdd/agents/sdd-architect.agent.md');
    await fs.appendFile(customized, '\n## Regla local\n');

    const report = await updateSDD(ws);

    // El barrido de obsoletos recorría las claves viejas y borraba todo lo que seguía
    // coincidiendo con su hash: agentes, skills y scripts vivos del kit.
    expect(report.removedStale, 'no debe borrar nada del kit').toEqual([]);
    expect(report.conflicts, 'no debe marcar .new lo que no cambió').toEqual([]);
    expect(report.updated).toEqual([]);
    expect(report.keptCustom).toEqual(['agents/sdd-architect.agent.md']);
    for (const key of posixKeys) {
      expect(await fs.pathExists(resolve(ws, 'sdd', key)), key).toBe(true);
    }
    expect(await fs.readFile(customized, 'utf-8')).toContain('## Regla local');
  });

  it('validate-sdd.mjs corre en verde sobre un árbol CRLF y conserva su set pristine', async () => {
    // El chequeo de portabilidad del validador exime los archivos idénticos a lo que shippeó
    // el kit (pristine). Un proyecto llamado como una palabra de la prosa del kit sólo pasa si
    // ese set funciona; con CRLF en disco y hashes byte a byte, quedaba vacío y el chequeo fallaba.
    const portability = mkdtempSync(resolve(tmpdir(), 'harness-crlf-validate-'));
    try {
      await generateSDD(portability, {
        projectName: 'catalog',
        description: 'Proyecto cuyo nombre aparece en la prosa del kit.',
        packageScope: '@catalog',
        apps: [{ name: 'portal', type: 'react' }],
        libs: [],
        services: [],
      });
      // todo el kit como lo deja un clon con core.autocrlf=true
      const toCrlfTree = async (dir: string) => {
        for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
          const full = resolve(dir, entry.name);
          if (entry.isDirectory()) {
            await toCrlfTree(full);
          } else if (/\.(md|json|mjs|ts|yml|yaml|txt)$/.test(entry.name)) {
            await toCrlf(full);
          }
        }
      };
      await toCrlfTree(resolve(portability, 'sdd'));
      expect(await fs.readFile(resolve(portability, 'sdd/tasks.json'), 'utf-8')).toContain('\r\n');

      // validate-sdd.mjs es ESM: importa ajv resolviendo desde SU propia ubicación, no desde
      // el cwd, así que un workspace en tmpdir no lo encuentra (es lo que hace fallar a los
      // specs de integración del kit en Windows). Un link a los node_modules de apps/cli
      // alcanza para correr el validador de verdad sobre este árbol.
      await fs.ensureSymlink(
        resolve(CLI_ROOT, 'node_modules'),
        resolve(portability, 'node_modules'),
        'junction',
      );

      const out = execFileSync(
        process.execPath,
        [resolve(portability, 'sdd/scripts/validate-sdd.mjs')],
        { encoding: 'utf-8', stdio: 'pipe' },
      );
      expect(out).toContain('OK');
      expect(out).not.toContain('hardcodes global.json');
      expect(out).not.toContain('is stale');
    } finally {
      rmSync(portability, { recursive: true, force: true });
    }
  });
});
