import { createHash } from 'node:crypto';
import { join, relative, resolve } from 'node:path';
import fs from 'fs-extra';
import { version } from '../version.js';

export const KIT_MANIFEST_FILE = 'kit.json';

/**
 * Frontera de propiedad dentro de sdd/ (la base del update seguro):
 * - kit-owned: reemplazable en un update (con detección de modificación local).
 * - data: del usuario — el update JAMÁS los toca.
 * - generated: regenerables después del update.
 */
const DATA_PREFIXES = [
  'specs/',
  'fixes/',
  'context/apps/',
  'context/libs/',
  'context/tools/',
  'memory/journal/',
];

const DATA_FILES = new Set([
  'global.json',
  'tasks.json',
  'api.json',
  'schema.json',
  'components.json',
  'fixes.json',
  'tools.json',
  // La memoria destilada del proyecto. El kit aporta su contenido inicial (se sirve
  // en la instalación, que copia el kit entero) pero a partir de ahí es del usuario:
  // como híbrido, cualquier release que tocara el seed dejaba un lessons.md.new con
  // lecciones genéricas al lado de la memoria real del repo — y este archivo se lee
  // COMPLETO en cada sesión de agente, con cap de 120 líneas. Ver `seedDataFile`.
  'memory/lessons.md',
]);

const GENERATED_FILES = new Set(['catalog.json']);

/**
 * Archivos del kit que arrancan como plantilla pero el usuario completa o el
 * instalador absorbe contenido previo. En modo legacy (sin manifest) nunca se
 * sobreescriben; con manifest los gobierna el hash como a cualquier otro.
 */
const HYBRID_FILES = new Set([
  'context/constitution.md',
  'context/context_prompt.md',
  'dual-harness/AGENTS.md',
  'dual-harness/CLAUDE.md',
  'dual-harness/GEMINI.md',
  'pricing.json',
]);

export type KitManifest = {
  kit_version: string;
  installed_at: string;
  files: Record<string, string>;
};

/**
 * Placeholders (.gitkeep) que el kit shippea DENTRO de directorios de datos:
 * son scaffolding, no datos. El manifiesto los excluye —con razón, nadie quiere
 * que el update toque `specs/` ni `memory/journal/`— pero entonces un repo
 * actualizado se quedaba sin el directorio que el gate necesita, mientras que
 * una instalación fresca (copia completa) sí lo tenía.
 */
export function isDataPlaceholder(relPath: string): boolean {
  return !isKitOwned(relPath) && relPath.endsWith('/.gitkeep');
}

export function isKitOwned(relPath: string): boolean {
  if (relPath === KIT_MANIFEST_FILE) return false;
  if (DATA_FILES.has(relPath)) return false;
  if (GENERATED_FILES.has(relPath)) return false;
  return !DATA_PREFIXES.some((p) => relPath.startsWith(p));
}

export function isGenerated(relPath: string): boolean {
  return GENERATED_FILES.has(relPath);
}

export function isHybrid(relPath: string): boolean {
  return HYBRID_FILES.has(relPath);
}

/**
 * CRLF folded to LF before hashing, for text files only (a NUL byte in the first 8 KB means
 * binary and the bytes are hashed as they are). A checkout made with core.autocrlf=true — the
 * Git for Windows default — hands us CRLF copies of files the kit shipped as LF; without this
 * every one of them read as "modified by the user": `update sdd` dropped a `.new` next to
 * files nobody touched and the validator's portability check lost its pristine set.
 */
export function normalizeEol(content: Buffer): Buffer {
  if (content.subarray(0, 8192).includes(0)) return content;
  if (!content.includes(0x0d)) return content;
  const out = Buffer.allocUnsafe(content.length);
  let j = 0;
  for (let i = 0; i < content.length; i++) {
    if (content[i] === 0x0d && content[i + 1] === 0x0a) continue;
    out[j++] = content[i];
  }
  return out.subarray(0, j);
}

export function hashContent(content: Buffer): string {
  return createHash('sha256').update(normalizeEol(content)).digest('hex');
}

export function hashFile(path: string): string {
  return hashContent(fs.readFileSync(path));
}

/** Las claves del manifest son rutas posix: un kit.json escrito en Windows tiene que leerse igual en Linux. */
export function toKitPath(rel: string): string {
  return rel.split('\\').join('/');
}

async function listAllFiles(kitDir: string): Promise<string[]> {
  const out: string[] = [];
  const walk = async (dir: string) => {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else out.push(toKitPath(relative(kitDir, full)));
    }
  };
  await walk(kitDir);
  return out.sort();
}

export async function listKitFiles(kitDir: string): Promise<string[]> {
  return (await listAllFiles(kitDir)).filter(isKitOwned);
}

export async function listDataPlaceholders(kitDir: string): Promise<string[]> {
  return (await listAllFiles(kitDir)).filter(isDataPlaceholder);
}

export async function computeManifest(kitDir: string): Promise<KitManifest> {
  const files: Record<string, string> = {};
  for (const rel of await listKitFiles(kitDir)) {
    files[rel] = hashFile(resolve(kitDir, rel));
  }
  return {
    kit_version: version,
    installed_at: new Date().toISOString().slice(0, 10),
    files,
  };
}

/**
 * El manifest es el baseline de lo que SHIPPEÓ el kit, no una foto de lo instalado:
 * un archivo preservado como conflicto difiere del kit a propósito, y anotar su hash
 * local lo haría pasar por "sin modificar" en el update siguiente — pisándolo.
 */
export async function writeManifest(
  sddDir: string,
  manifest?: KitManifest,
): Promise<void> {
  const value = manifest ?? (await computeManifest(sddDir));
  await fs.writeJSON(resolve(sddDir, KIT_MANIFEST_FILE), value, {
    spaces: 2,
  });
}

export async function readManifest(sddDir: string): Promise<KitManifest | null> {
  const path = resolve(sddDir, KIT_MANIFEST_FILE);
  if (!(await fs.pathExists(path))) return null;
  try {
    const manifest = await fs.readJSON(path);
    if (!manifest?.files) return null;
    // A kit.json written on Windows by <= v0.14.1 has backslash keys
    // (`agents\\sdd-planner.agent.md`). The keys computed from the kit are posix, so without
    // this every lookup missed: the update marked each changed file as a conflict, and the
    // stale sweep — which walks the OLD keys and deletes what still matches its hash — removed
    // live agents, skills and scripts, reported as removedStale.
    return {
      ...manifest,
      files: Object.fromEntries(
        Object.entries(manifest.files as Record<string, string>).map(([key, hash]) => [
          toKitPath(key),
          hash,
        ]),
      ),
    };
  } catch {
    return null;
  }
}
