import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import fs from 'fs-extra';

import { generateSDD } from '../sdd.generator.js';
import { updateSDD } from '../update.generator.js';
import { hashContent, normalizeEol } from '../kit-manifest.js';

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
});
