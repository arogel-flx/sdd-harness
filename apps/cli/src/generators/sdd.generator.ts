import { resolve } from 'node:path';
import fs from 'fs-extra';
import { getTemplatesDir } from '../utils/fs.js';
import { exec } from '../utils/exec.js';
import { logger } from '../utils/logger.js';
import { writeManifest } from './kit-manifest.js';
import type { WorkspaceOptions } from './workspace.generator.js';
import type { AppSpec } from './app.generator.js';

/**
 * Cómo se instala el kit según la forma del repo destino:
 * - layout 'nx':         monorepo Nx (apps/, libs/, tools/) — el modo clásico.
 * - layout 'standalone': una sola app con el código en la raíz del repo. Se
 *   registra como app lógica única `apps/<nombre>` en los registros SDD (los
 *   schemas exigen ese patrón y el validador nunca chequea que exista en
 *   disco), con su contexto en sdd/context/apps/<nombre>/.
 */
/** Perfil de trabajo del repo (sdd/global.json.profile). Ausente = team. */
export type SddProfile = 'team' | 'solo';

/** Los archivos de instrucciones de la raíz que el arnés dual enlaza a sdd/dual-harness/. */
export const ROOT_HARNESS_FILES = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md'] as const;

export function parseProfile(raw: unknown): SddProfile | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (raw === 'team' || raw === 'solo') return raw;
  throw new Error(`Invalid profile "${String(raw)}" — expected team | solo`);
}

export interface SDDInstallConfig {
  layout?: 'nx' | 'standalone';
  /**
   * Si el repo usa Nx de verdad (nx.json / apps/). Default: layout === 'nx'. Un repo multi-app
   * sin Nx (`configure sdd --apps` sobre un repo cualquiera) usa layout 'nx' para los
   * registros pero no recibe .nxignore ni `monorepo.tool: "Nx"`.
   */
  nx?: boolean;
  /** Inyecta scripts sdd:* + setup:agents y ajv/ajv-formats en el package.json (lo crea si falta). */
  mergePackageJson?: boolean;
  /** Absorbe AGENTS.md/CLAUDE.md/GEMINI.md preexistentes dentro de sdd/dual-harness antes de symlink-ear. */
  absorbExistingHarness?: boolean;
}

/**
 * Instala el sistema SDD portable.
 *
 * El kit de templates/sdd/ se copia verbatim: sdd/global.json es el único
 * archivo que lleva nombre y descripción del proyecto (validate-sdd.mjs falla
 * si se filtran a cualquier otro archivo del kit), así que no hace falta
 * renderizar templates.
 */
export async function generateSDD(
  root: string,
  opts: WorkspaceOptions,
  install: SDDInstallConfig = {},
): Promise<void> {
  const layout = install.layout ?? 'nx';
  const usesNx = install.nx ?? layout === 'nx';
  const kitDir = resolve(getTemplatesDir(), 'sdd');
  const destDir = resolve(root, 'sdd');

  const previousHarness = install.absorbExistingHarness
    ? await readExistingHarnessFiles(root)
    : new Map<string, string>();

  if (await fs.pathExists(destDir)) {
    await fs.remove(destDir);
  }
  await fs.copy(kitDir, destDir);
  // Baseline para `harness update sdd`: hash de cada archivo kit-owned tal
  // como se instaló — permite distinguir "modificado por el usuario" de
  // "cambiado por el kit" en futuros updates.
  await writeManifest(destDir);

  await writeGlobalJson(root, opts, layout, usesNx);

  for (const app of opts.apps) {
    await createSubprojectContext(root, 'apps', app.name, app.type, layout, app.path);
  }
  for (const lib of opts.libs) {
    await createSubprojectContext(root, 'libs', lib.name, lib.type, layout);
  }

  if (usesNx) {
    // sdd/templates trae blueprints con project.json; sin esto Nx los registra
    // como proyectos reales y CI explota por executors inexistentes.
    await fs.writeFile(resolve(root, '.nxignore'), 'sdd/templates\n', 'utf-8');
  }

  if (install.mergePackageJson) {
    await ensureHarnessPackageJson(root, opts.projectName);
  }

  for (const [file, content] of previousHarness) {
    await absorbIntoDualHarness(root, file, content);
  }
  await writeRootHarnessCopies(root);

  const linked = runSetupAgents(root);
  await ensureRootHarnessFiles(root, linked);
}

/**
 * Registra una app, lib o tool en sdd/global.json (sección monorepo) y crea su
 * contexto de subproyecto. Usado por `harness add app` y `harness add tool` en
 * workspaces existentes. `monorepo.tools` es opcional en el schema: la clave se
 * crea recién cuando se registra la primera tool.
 */
export async function registerSubprojectInSDD(
  root: string,
  category: 'apps' | 'libs' | 'tools',
  name: string,
  type: string,
): Promise<void> {
  const globalPath = resolve(root, 'sdd/global.json');
  if (await fs.pathExists(globalPath)) {
    const globalJson = await fs.readJSON(globalPath);
    if (typeof globalJson.monorepo[category] !== 'object') {
      globalJson.monorepo[category] = {};
    }
    globalJson.monorepo[category][name] = `${category}/${name} — ${type}`;
    await fs.writeJSON(globalPath, globalJson, { spaces: 2 });
  }
  await createSubprojectContext(root, category, name, type, 'nx');
}

/**
 * Garantiza que el package.json raíz tenga los scripts del arnés SDD
 * (tomados del propio kit, para no duplicar valores) y las devDependencies
 * que el validador necesita. Crea un package.json mínimo si el repo no tiene
 * (repos Java/Python puros).
 */
export async function ensureHarnessPackageJson(
  root: string,
  projectName: string,
): Promise<void> {
  const pkgPath = resolve(root, 'package.json');
  const kitPkg = await fs.readJSON(
    resolve(getTemplatesDir(), 'sdd/templates/nx-workspace/package.json'),
  );

  const pkg = (await fs.pathExists(pkgPath))
    ? await fs.readJSON(pkgPath)
    : { name: projectName, version: '0.1.0', private: true };

  pkg.scripts = pkg.scripts ?? {};
  for (const [key, value] of Object.entries<string>(kitPkg.scripts)) {
    if (key === 'setup:agents' || key.startsWith('sdd:')) {
      pkg.scripts[key] = pkg.scripts[key] ?? value;
    }
  }
  // postinstall keeps rtk operational for whoever clones the repo (`pnpm install`
  // runs it). A project that already owns a postinstall keeps it untouched.
  if (kitPkg.scripts.postinstall && !pkg.scripts.postinstall) {
    pkg.scripts.postinstall = kitPkg.scripts.postinstall;
  }

  pkg.devDependencies = pkg.devDependencies ?? {};
  for (const dep of ['ajv', 'ajv-formats']) {
    pkg.devDependencies[dep] =
      pkg.devDependencies[dep] ?? kitPkg.devDependencies[dep];
  }

  await fs.writeJSON(pkgPath, pkg, { spaces: 2 });
}

const ABSORBED_HEADING =
  '## Instrucciones previas del proyecto (absorbidas al instalar SDD)';

/**
 * Qué instrucciones previas del repo hay que conservar dentro de sdd/dual-harness/:
 * - un AGENTS.md/CLAUDE.md/GEMINI.md REAL en la raíz (repo sin SDD) → se lee y se deja donde
 *   está: después de absorberlo, writeRootHarnessCopies lo sobreescribe con el contenido final
 *   del dual-harness y setup-agents lo reconoce como copia del kit y lo reemplaza por el link.
 *   Hasta v0.14.1 se borraba acá, y cualquier fallo entre este punto y el link (un package.json
 *   inválido, un EPERM, el propio setup-agents) dejaba el repo sin archivos de instrucciones;
 * - una copia idéntica al dual-harness anterior (lo que dejó un link fallido) no es texto del
 *   equipo: no se absorbe, o el kit se anidaría dentro de sí mismo en cada configure;
 * - lo que una instalación anterior ya había absorbido en sdd/dual-harness/<file> (la raíz
 *   es un symlink) → se rescata ANTES de que el reset borre sdd/. Hasta v0.11.0 un segundo
 *   `configure sdd` perdía ese texto sin aviso.
 */
async function readExistingHarnessFiles(
  root: string,
): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  for (const file of ROOT_HARNESS_FILES) {
    const parts: string[] = [];

    const previous = resolve(root, 'sdd/dual-harness', file);
    if (await fs.pathExists(previous)) {
      const content = await fs.readFile(previous, 'utf-8');
      const idx = content.indexOf(ABSORBED_HEADING);
      if (idx !== -1) {
        const absorbed = content.slice(idx + ABSORBED_HEADING.length).trim();
        if (absorbed) parts.push(absorbed);
      }
    }

    const path = resolve(root, file);
    if (await fs.pathExists(path)) {
      const stat = await fs.lstat(path);
      if (!stat.isSymbolicLink()) {
        const content = await fs.readFile(path, 'utf-8');
        const previousContent = (await fs.pathExists(previous))
          ? await fs.readFile(previous, 'utf-8')
          : null;
        if (!isKitCopy(content, previousContent)) parts.push(content.trim());
      }
    }

    if (parts.length) found.set(file, parts.join('\n\n'));
  }
  return found;
}

/** Mismo contenido salvo fines de línea: la copia que dejó un link fallido, no texto del equipo. */
function isKitCopy(content: string, kitContent: string | null): boolean {
  if (kitContent === null) return false;
  const fold = (s: string) => s.replace(/\r\n/g, '\n').trim();
  return fold(content) === fold(kitContent);
}

/**
 * Los archivos de instrucciones de la raíz que siguen siendo reales (no links) pasan a ser una
 * copia exacta de sdd/dual-harness/<file> ANTES de correr setup-agents. Así la raíz nunca queda
 * vacía, y los dos scripts reconocen la copia como del kit y la reemplazan por el link.
 */
async function writeRootHarnessCopies(root: string): Promise<void> {
  for (const file of ROOT_HARNESS_FILES) {
    const target = resolve(root, file);
    const stat = await fs.lstat(target).catch(() => null);
    if (!stat || stat.isSymbolicLink()) continue;
    const source = resolve(root, 'sdd/dual-harness', file);
    if (!(await fs.pathExists(source))) continue;
    await fs.copy(source, target, { overwrite: true });
  }
}

async function absorbIntoDualHarness(
  root: string,
  file: string,
  content: string,
): Promise<void> {
  const target = resolve(root, 'sdd/dual-harness', file);
  await fs.appendFile(
    target,
    `\n\n---\n\n${ABSORBED_HEADING}\n\n${content.trim()}\n`,
    'utf-8',
  );
  logger.info(
    `Existing ${file} content preserved inside sdd/dual-harness/${file}`,
  );
}

async function writeGlobalJson(
  root: string,
  opts: WorkspaceOptions,
  layout: 'nx' | 'standalone',
  usesNx: boolean = layout === 'nx',
): Promise<void> {
  const apps: Record<string, string> = {};
  for (const app of opts.apps) {
    apps[app.name] = describeAppEntry(app, layout);
  }

  const libs: Record<string, string> = {};
  for (const lib of opts.libs) {
    libs[lib.name] = `libs/${lib.name} — ${lib.type}`;
  }

  // La forma debe cumplir sdd/schemas/global.schema.json (additionalProperties: false).
  await fs.writeJSON(
    resolve(root, 'sdd/global.json'),
    {
      $schema: './schemas/global.schema.json',
      project: opts.projectName,
      description: opts.description,
      version: '0.1.0',
      ...(opts.sddProfile ? { profile: opts.sddProfile } : {}),
      completed_modules: [],
      in_progress_modules: [],
      pending_modules: [],
      monorepo: {
        tool:
          layout === 'standalone'
            ? 'none (standalone repo)'
            : usesNx
              ? 'Nx'
              : 'none (multi-app repo)',
        package_manager: 'pnpm',
        apps,
        libs,
      },
    },
    { spaces: 2 },
  );
}

/**
 * Valor de sdd/global.json → monorepo.apps[name]. Texto libre para el visor y las personas;
 * el identificador lógico de los registros sigue siendo apps/<name> (los schemas lo exigen).
 * Cuando el código no vive en apps/<name> se dice dónde vive, así nadie lo busca donde no está.
 */
export function describeAppEntry(
  app: AppSpec,
  layout: 'nx' | 'standalone',
): string {
  if (layout === 'standalone') {
    return `. — ${app.type} (standalone: código en la raíz del repo)`;
  }
  const codePath = app.path ?? `apps/${app.name}`;
  return codePath === `apps/${app.name}`
    ? `apps/${app.name} — ${app.type}`
    : `${codePath} — ${app.type} (código en ${codePath}; id lógico apps/${app.name})`;
}

async function createSubprojectContext(
  root: string,
  category: 'apps' | 'libs' | 'tools',
  name: string,
  type: string,
  layout: 'nx' | 'standalone',
  codePath?: string,
): Promise<void> {
  const dir = resolve(root, 'sdd/context', category, name);
  await fs.ensureDir(resolve(dir, 'updates'));
  await fs.writeFile(resolve(dir, 'updates/.gitkeep'), '', 'utf-8');

  const livesElsewhere = codePath && codePath !== `${category}/${name}`;
  const locationNote =
    layout === 'standalone'
      ? `> ⚠ **Repo standalone:** el código de esta app vive en la **raíz del repositorio**, no en \`${category}/${name}/\`. El identificador \`${category}/${name}\` es la convención con la que los registros SDD (global.json, specs, ciclos) refieren a este único subproyecto lógico.\n\n`
      : livesElsewhere
        ? `> ⚠ **Ubicación:** el código de este subproyecto vive en \`${codePath}/\`, no en \`${category}/${name}/\`. El identificador \`${category}/${name}\` es la convención con la que los registros SDD (global.json, specs, ciclos) refieren a él.\n\n`
        : '';

  const constitutionPath = resolve(dir, 'constitution.md');
  if (!(await fs.pathExists(constitutionPath))) {
    await fs.writeFile(
      constitutionPath,
      `# Constitución — ${category}/${name}

> Versión 1.0 | Última actualización: cycle-0 (inicial)
> **PLANTILLA:** completar las secciones marcadas con \`[...]\` en el primer ciclo que toque este subproyecto.

${locationNote}## 1. Propósito

- **Tipo:** ${type}
- **Rol en el sistema:** [Qué problema resuelve este subproyecto y para quién.]

## 2. Stack tecnológico

- [Framework / librerías principales y versión]

## 3. Estructura y patrones

- [Estructura de carpetas y patrones de diseño adoptados]

## 4. Convenciones propias

- [Naming, testing, límites de dependencia con otros subproyectos]

> Las actualizaciones por ciclo/fix van como fragmentos aditivos en \`updates/\` —
> este archivo base solo lo modifica la consolidación (ver \`sdd/context/context_prompt.md\` sección 6).
`,
      'utf-8',
    );
  }

  const contextPromptPath = resolve(dir, 'context_prompt.md');
  if (!(await fs.pathExists(contextPromptPath))) {
    await fs.writeFile(
      contextPromptPath,
      `# Context Prompt — ${category}/${name}

> Entry point para agentes que trabajen sobre \`${category}/${name}\`.
> Leer junto con \`constitution.md\` de este directorio **+ \`updates/*.md\` en orden de nombre**.

${locationNote}- **Tipo:** ${type}
- **Estado:** recién generado — sin ciclos SDD completados todavía.
- [Completar en el primer ciclo: módulos existentes, endpoints/componentes clave, cómo correr y testear.]
`,
      'utf-8',
    );
  }
}

/** Runs setup-agents; returns false when the script could not run or exited non-zero. */
function runSetupAgents(root: string): boolean {
  try {
    if (process.platform === 'win32') {
      exec(
        'powershell -ExecutionPolicy Bypass -File sdd/scripts/setup-agents.ps1',
        { cwd: root },
      );
    } else {
      exec('bash sdd/scripts/setup-agents.sh', { cwd: root });
    }
    return true;
  } catch {
    logger.warn(
      'setup-agents did not finish. Run `pnpm setup:agents` in the workspace to create the .claude/.github/.agents/.gemini surfaces and link root AGENTS.md/CLAUDE.md/GEMINI.md.',
    );
    return false;
  }
}

/**
 * Después de setup-agents, cualquier archivo de instrucciones que falte en la raíz se repone
 * como copia real de sdd/dual-harness/<file>: la raíz nunca queda sin instrucciones. El caso
 * normal es que ya estén (writeRootHarnessCopies los deja antes de enlazar), así que esto cubre
 * GEMINI.md cuando no existía y cualquier fallo del script; ambos instaladores reconocen la
 * copia como del kit y la convierten en link en la próxima corrida.
 */
export async function ensureRootHarnessFiles(
  root: string,
  linked: boolean,
): Promise<void> {
  for (const file of ROOT_HARNESS_FILES) {
    const target = resolve(root, file);
    // lstat, not pathExists: a link (even a dangling one) counts as "the script did its job".
    const present = await fs.lstat(target).then(
      () => true,
      () => false,
    );
    if (present) continue;
    const source = resolve(root, 'sdd/dual-harness', file);
    if (!(await fs.pathExists(source))) continue;
    await fs.copy(source, target);
    logger.warn(
      `${file}: ${linked ? 'setup-agents did not link it' : 'setup-agents failed'} — wrote a real copy from sdd/dual-harness/ instead. Run \`pnpm setup:agents\` to turn it into a link.`,
    );
  }
}
