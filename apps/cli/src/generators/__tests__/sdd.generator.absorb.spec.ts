import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import fs from 'fs-extra';

vi.mock('../../utils/exec.js', () => ({
  exec: vi.fn(() => {
    throw new Error('Command failed: setup-agents');
  }),
  execSilent: vi.fn(() => ''),
}));

import { generateSDD, teamContribution } from '../sdd.generator.js';

const ABSORBED = '## Instrucciones previas del proyecto (absorbidas al instalar SDD)';

// Seguimiento de la review de #38: la absorción reconocía sólo la copia idéntica del kit.
describe('teamContribution — qué parte de un archivo de la raíz es del equipo', () => {
  it('sin kit previo, todo el contenido es del equipo', () => {
    expect(teamContribution('# Reglas\n\nno tocar prod\n', null)).toBe(
      '# Reglas\n\nno tocar prod',
    );
  });

  it('una copia idéntica del kit no aporta nada (ni con distinto fin de línea)', () => {
    const kit = '# Kit\n\nreglas del kit\n';
    expect(teamContribution(kit, kit)).toBeNull();
    expect(teamContribution(kit.replace(/\n/g, '\r\n'), kit)).toBeNull();
  });

  it('una copia del kit EDITADA aporta sólo la cola, no el kit entero', () => {
    const kit = '# Kit\n\nreglas del kit\n';
    const edited = kit + '\n## Nota del equipo\n\nusar pnpm\n';
    expect(teamContribution(edited, kit)).toBe('## Nota del equipo\n\nusar pnpm');
  });

  it('un archivo con el encabezado de absorción aporta sólo lo que está después', () => {
    const own = `# Otro kit\n\n${ABSORBED}\n\nreglas viejas del equipo\n`;
    expect(teamContribution(own, '# Kit distinto\n')).toBe('reglas viejas del equipo');
  });

  it('un symlink degradado (archivo con la ruta destino) no es texto del equipo', () => {
    expect(teamContribution('sdd/dual-harness/AGENTS.md', null)).toBeNull();
    expect(teamContribution('../sdd/agents\n', null)).toBeNull();
    expect(teamContribution('sdd\\dual-harness\\CLAUDE.md', null)).toBeNull();
    // pero un archivo real que MENCIONA esa ruta sí lo es
    expect(teamContribution('Ver sdd/dual-harness/AGENTS.md para las reglas.', null)).toBe(
      'Ver sdd/dual-harness/AGENTS.md para las reglas.',
    );
  });

  it('un archivo vacío no aporta nada', () => {
    expect(teamContribution('   \n\n', null)).toBeNull();
  });
});

describe('configure sdd — la absorción no anida el kit dentro de sí mismo', () => {
  let root: string;
  const OPTS = {
    projectName: 'legacy-repo',
    description: 'Repo existente.',
    packageScope: '@legacy-repo',
    apps: [{ name: 'legacy-repo', type: 'app' }],
    libs: [],
    services: [],
  };
  const INSTALL = { layout: 'standalone' as const, mergePackageJson: true, absorbExistingHarness: true };

  beforeEach(() => {
    root = mkdtempSync(resolve(tmpdir(), 'harness-absorb-'));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('la copia editada tras un link fallido no vuelve entera al dual-harness', async () => {
    await fs.writeFile(resolve(root, 'AGENTS.md'), '# Reglas\n\nnunca tocar prod\n', 'utf-8');
    await generateSDD(root, OPTS, INSTALL);

    // setup-agents falla (mock): la raíz quedó como copia real del dual-harness. El equipo la edita.
    await fs.appendFile(resolve(root, 'AGENTS.md'), '\n## Agregado después\n\nusar pnpm\n');

    await generateSDD(root, OPTS, INSTALL);

    const dual = await fs.readFile(resolve(root, 'sdd/dual-harness/AGENTS.md'), 'utf-8');
    expect(dual.split(ABSORBED).length - 1, 'un solo encabezado de absorción').toBe(1);
    expect(dual.split('nunca tocar prod').length - 1, 'el texto original una sola vez').toBe(1);
    expect(dual).toContain('usar pnpm');
    // el cuerpo del kit no entró como "instrucciones previas"
    const absorbed = dual.slice(dual.indexOf(ABSORBED));
    expect(absorbed).not.toContain('Spec-Driven Development');
  });

  it('un symlink degradado en la raíz no se absorbe como instrucciones del equipo', async () => {
    // lo que deja un clon con core.symlinks=false
    await fs.writeFile(resolve(root, 'CLAUDE.md'), 'sdd/dual-harness/CLAUDE.md', 'utf-8');

    await generateSDD(root, OPTS, INSTALL);

    const dual = await fs.readFile(resolve(root, 'sdd/dual-harness/CLAUDE.md'), 'utf-8');
    expect(dual).not.toContain(ABSORBED);
    expect(dual.trimStart().startsWith(String.fromCharCode(115,100,100)), "el dual-harness no empieza con la ruta del link").toBe(false);
  });
});
