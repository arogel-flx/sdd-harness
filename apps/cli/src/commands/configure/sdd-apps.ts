import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import type { AppSpec } from '../../generators/app.generator.js';

/**
 * Qué aplicaciones registra `configure sdd` en un repo existente.
 *
 * Hasta v0.14.1 un repo con nx.json y las apps fuera de apps/ (src/<name>/project.json, por
 * ejemplo) instalaba el kit con `monorepo.apps = {}` y sin ningún aviso: la primera spec
 * fallaba el gate porque nunca existió sdd/context/apps/<name>/. Ahora:
 *   1. `--apps name=path[,name=path]` gana siempre (lo declara la persona o el agente);
 *   2. en un monorepo se descubren apps/<dir> y todo project.json con projectType
 *      "application" fuera de apps/, hasta MAX_DEPTH niveles;
 *   3. un monorepo sin ninguna app es un error, no un kit vacío (lo decide el comando).
 * El identificador lógico en los registros sigue siendo apps/<name> (los schemas lo exigen);
 * `path` solo documenta dónde vive el código.
 *
 * Los nombres tienen que cumplir lo que después exigen los schemas del kit y `add spec`
 * (`^(apps|libs|tools)/[a-z][a-z0-9-]*$`). Un project.json de Nx suele llamarse `@acme/api`,
 * `Api_Gateway` o `2fa`: el descubrimiento los normaliza y falla si dos colisionan; `--apps`
 * exige el nombre ya válido y sugiere la forma normalizada.
 */

/** Lo que aceptan los schemas para el <name> de apps/<name>. */
export const SUBPROJECT_NAME_RE = /^[a-z][a-z0-9-]*$/;

/**
 * `@acme/api` -> `api`, `Api_Gateway` -> `api-gateway`, `2fa` -> `app-2fa`: sin scope npm, en
 * minúsculas, cualquier otra corrida de caracteres pasa a `-`, y un dígito inicial se prefija.
 */
export function toSubprojectName(raw: string): string {
  let name = raw
    .trim()
    .replace(/^@[^/]+\//, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  if (/^[0-9]/.test(name)) name = `app-${name}`;
  return name;
}

/** Heurística mínima de tipo por marcadores del stack — solo informativa. */
export function detectAppType(dir: string): string {
  if (existsSync(resolve(dir, 'pom.xml'))) return 'springboot';
  if (existsSync(resolve(dir, 'build.gradle'))) return 'springboot';
  if (existsSync(resolve(dir, 'pyproject.toml'))) return 'python';
  if (existsSync(resolve(dir, 'next.config.js')) || existsSync(resolve(dir, 'next.config.ts')))
    return 'nextjs';
  if (existsSync(resolve(dir, 'nest-cli.json'))) return 'nestjs';
  if (existsSync(resolve(dir, 'vite.config.ts'))) return 'react';
  return 'app';
}

/** Directorios que nunca contienen apps del repo: dependencias, salidas de build, el propio kit. */
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'out',
  'target',
  'coverage',
  'tmp',
  'temp',
  'sdd', // sdd/templates trae blueprints con project.json
  'apps', // se recorre aparte, arriba
  'libs',
  'tools',
]);
const MAX_DEPTH = 4;

const toPosix = (p: string): string => p.split(sep).join('/');

function readProjectJson(file: string): { name?: unknown; projectType?: unknown } | null {
  try {
    return JSON.parse(readFileSync(file, 'utf-8')) as { name?: unknown; projectType?: unknown };
  } catch {
    return null;
  }
}

/**
 * Aplicaciones de un monorepo, vivan donde vivan: cada directorio de apps/ (layout clásico) y
 * cada project.json con projectType "application" fuera de apps/. Un directorio con project.json
 * es una hoja: no se entra a buscar más adentro (un workspace anidado tiene sus propias apps).
 * Orden: apps/ primero, después el resto en orden de recorrido; el nombre sale de project.json.
 */
export function discoverNxApplications(cwd: string): AppSpec[] {
  const found = new Map<string, { spec: AppSpec; raw: string }>();
  const register = (raw: string, type: string, path: string): void => {
    const name = toSubprojectName(raw);
    if (!SUBPROJECT_NAME_RE.test(name)) {
      throw new Error(
        `configure sdd: "${raw}" (${path}) cannot be turned into a valid subproject name (${SUBPROJECT_NAME_RE}). Rename it or pass --apps.`,
      );
    }
    const previous = found.get(name);
    if (previous) {
      if (previous.spec.path === path) return;
      throw new Error(
        `configure sdd: "${raw}" (${path}) and "${previous.raw}" (${previous.spec.path}) both map to apps/${name}. Rename one, or pass --apps with distinct names.`,
      );
    }
    found.set(name, { spec: { name, type, path }, raw });
  };

  const appsDir = resolve(cwd, 'apps');
  if (existsSync(appsDir)) {
    for (const d of safeReaddir(appsDir)) {
      if (!d.isDirectory()) continue;
      register(d.name, detectAppType(resolve(appsDir, d.name)), `apps/${d.name}`);
    }
  }

  const walk = (dir: string, depth: number): void => {
    if (depth > MAX_DEPTH) return;
    for (const entry of safeReaddir(dir)) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) {
        continue;
      }
      const full = resolve(dir, entry.name);
      const projectJson = resolve(full, 'project.json');
      if (existsSync(projectJson)) {
        const project = readProjectJson(projectJson);
        if (project?.projectType === 'application') {
          const raw =
            typeof project.name === 'string' && project.name.trim()
              ? project.name.trim()
              : entry.name;
          register(raw, detectAppType(full), toPosix(relative(cwd, full)));
        }
        continue;
      }
      walk(full, depth + 1);
    }
  };
  walk(cwd, 1);

  return [...found.values()].map((f) => f.spec);
}

function safeReaddir(dir: string) {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

/**
 * `--apps name=path[,name=path]`: registro explícito, gana sobre la detección. El nombre tiene
 * que ser ya válido para los registros (se sugiere la forma normalizada si no lo es); el path es
 * relativo a la raíz del repo, tiene que existir y quedarse dentro del repo. Lanza Error con
 * un mensaje listo para mostrar; el comando decide cómo salir.
 */
export function parseAppsFlag(raw: string, cwd: string): AppSpec[] {
  const apps: AppSpec[] = [];
  const items = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (items.length === 0) {
    throw new Error('--apps needs at least one name=path (e.g. --apps api=src/api,web=src/web).');
  }
  for (const item of items) {
    const eq = item.indexOf('=');
    if (eq <= 0 || eq === item.length - 1) {
      throw new Error(`--apps: expected name=path, got "${item}".`);
    }
    const name = item.slice(0, eq).trim();
    const rawPath = item.slice(eq + 1).trim();
    if (!SUBPROJECT_NAME_RE.test(name)) {
      const suggestion = toSubprojectName(name);
      throw new Error(
        `--apps: "${name}" is not a valid subproject name — registries require ${SUBPROJECT_NAME_RE}${
          suggestion ? ` (try "${suggestion}")` : ''
        }.`,
      );
    }
    if (apps.some((a) => a.name === name)) {
      throw new Error(`--apps: "${name}" is listed twice.`);
    }
    if (isAbsolute(rawPath)) {
      throw new Error(`--apps: ${name} has an absolute path; paths are relative to the repo root.`);
    }
    const abs = resolve(cwd, rawPath);
    const rel = relative(cwd, abs);
    if (rel === '' || rel.startsWith('..')) {
      throw new Error(`--apps: ${name} points at "${rawPath}", which is not a directory inside the repo.`);
    }
    if (!existsSync(abs) || !statSync(abs).isDirectory()) {
      throw new Error(`--apps: ${name} points at "${rawPath}", which is not a directory under ${cwd}.`);
    }
    apps.push({ name, type: detectAppType(abs), path: toPosix(rel) });
  }
  return apps;
}

/** `name (type)` o `name (type @ path)` cuando el código no vive en apps/<name>. */
export function describeApp(app: AppSpec): string {
  const at = app.path && app.path !== `apps/${app.name}` ? ` @ ${app.path}` : '';
  return `${app.name} (${app.type}${at})`;
}
