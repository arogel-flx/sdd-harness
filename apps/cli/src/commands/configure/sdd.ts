import { defineCommand } from 'citty';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { logger } from '../../utils/logger.js';
import { generateSDD } from '../../generators/sdd.generator.js';
import type { WorkspaceOptions } from '../../generators/workspace.generator.js';
import type { AppSpec } from '../../generators/app.generator.js';
import { parseProfile } from '../../generators/sdd.generator.js';
import {
  describeApp,
  detectAppType,
  discoverNxApplications,
  parseAppsFlag,
} from './sdd-apps.js';

/**
 * Modo "sdd-harness": instala (o reinstala) el sistema SDD portable en un
 * proyecto YA existente, sin tocar su código:
 * - Detecta la forma del repo: monorepo Nx o standalone (código en raíz). En un monorepo
 *   registra las apps de apps/ Y cualquier project.json con projectType "application" que
 *   viva en otro lado (src/<name>, packages/<name>...); --apps name=path las declara a mano.
 * - Inyecta scripts sdd:* + setup:agents y ajv/ajv-formats en el package.json
 *   (lo crea mínimo si el repo no es Node — Java/Python puros).
 * - Absorbe AGENTS.md/CLAUDE.md preexistentes dentro de sdd/dual-harness antes
 *   de reemplazarlos por symlinks — no se pierde ninguna instrucción previa.
 * - Los agentes/skills/commands propios del repo (.claude/, .github/, .agents/) se
 *   conservan: setup-agents enlaza el kit al lado y deja *.new en cada colisión.
 */
export const configureSddCommand = defineCommand({
  meta: {
    name: 'sdd',
    description:
      'Install the portable SDD system + dual harness on an existing project',
  },
  args: {
    name: {
      type: 'string',
      description: 'Project name (skips the prompt)',
    },
    description: {
      type: 'string',
      description: 'Project description (skips the prompt)',
    },
    yes: {
      type: 'boolean',
      alias: 'y',
      description:
        'Skip confirmations — required to RESET an existing sdd/ without a TTY',
      default: false,
    },
    profile: {
      type: 'string',
      description:
        'Working profile written to sdd/global.json: team (full cycles, default) | solo (lite cycles, single actor)',
    },
    apps: {
      type: 'string',
      description:
        'Applications to register, as name=path pairs separated by commas (e.g. api=src/api,web=src/web). Skips detection; the logical id stays apps/<name>',
    },
  },
  async run({ args }) {
    p.intro(pc.bgCyan(pc.black(' harness configure sdd ')));

    const cwd = process.cwd();

    const globalPath = resolve(cwd, 'sdd/global.json');
    if (existsSync(globalPath)) {
      if (args.yes) {
        logger.warn(
          'SDD is already installed — resetting sdd/ (specs, cycles and fixes included) because --yes was passed.',
        );
      } else {
        const confirm = await p.confirm({
          message:
            'SDD is already installed. This will RESET the whole sdd/ directory (specs, cycles and fixes included). Continue?',
          initialValue: false,
        });

        if (!confirm || p.isCancel(confirm)) {
          p.cancel('Operation cancelled.');
          process.exit(0);
        }
      }
    }

    // Nombre: package.json si existe; si no, la carpeta del repo
    const pkgPath = resolve(cwd, 'package.json');
    const pkg = existsSync(pkgPath)
      ? JSON.parse(readFileSync(pkgPath, 'utf-8'))
      : null;
    const defaultName =
      pkg?.name?.replace(/^@[^/]+\//, '') || basename(cwd);

    const projectName =
      args.name ??
      (await p.text({
        message: 'Project name (stored only in sdd/global.json):',
        initialValue: defaultName,
        validate: (value) => (value ? undefined : 'Project name is required'),
      }));

    if (p.isCancel(projectName)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }

    if (!(projectName as string).trim()) {
      logger.error('Project name cannot be empty.');
      process.exit(1);
    }

    const description =
      args.description ??
      (await p.text({
        message: 'Project description (stored only in sdd/global.json):',
        placeholder: 'What it does, main stack, methodology (SDD)',
        initialValue: pkg?.description || '',
      }));

    if (p.isCancel(description)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }

    // Forma del repo: Nx (nx.json o apps/), multi-app sin Nx (--apps en un repo cualquiera) o
    // standalone (código en raíz). Explícito gana; si no, en un monorepo se descubren las apps de
    // apps/ y los project.json de tipo application fuera de apps/; un monorepo sin ninguna app es
    // un error, no un kit vacío. Solo un repo Nx real recibe .nxignore y `tool: "Nx"`.
    const isNxLayout =
      existsSync(resolve(cwd, 'nx.json')) || existsSync(resolve(cwd, 'apps'));
    const isMonorepo = isNxLayout || Boolean(args.apps);

    let apps: AppSpec[] = [];
    try {
      if (args.apps) {
        apps = parseAppsFlag(args.apps, cwd);
      } else if (isNxLayout) {
        apps = discoverNxApplications(cwd);
      } else {
        apps = [{ name: projectName as string, type: detectAppType(cwd) }];
      }
    } catch (err) {
      logger.error((err as Error).message);
      process.exit(1);
    }

    if (isMonorepo && apps.length === 0) {
      logger.error(
        'nx.json found but no applications: nothing under apps/ and no project.json with projectType "application" elsewhere. Pass --apps name=path[,name=path] (e.g. --apps api=src/api,web=src/web).',
      );
      process.exit(1);
    }

    p.note(
      [
        `${pc.bold('Layout:')} ${isMonorepo ? (isNxLayout ? 'Nx monorepo' : 'multi-app (--apps)') : 'standalone (repo = una app lógica)'}`,
        `${pc.bold('Apps registradas:')} ${apps.map(describeApp).join(', ') || 'none'}`,
        `${pc.bold('package.json:')} ${pkg ? 'merge de scripts sdd:* + ajv' : 'se crea uno mínimo para el arnés'}`,
        `${pc.bold('AGENTS.md/CLAUDE.md previos:')} se absorben en sdd/dual-harness`,
        `${pc.bold('.claude/.github/.agents propios:')} se conservan; el kit se enlaza al lado y toda colisión queda como *.new`,
      ].join('\n'),
      'Install plan',
    );

    logger.step('Installing portable SDD system...');

    const profile = parseProfile(args.profile);

    const opts: WorkspaceOptions = {
      projectName: projectName as string,
      description: (description as string) || '',
      packageScope: pkg?.name?.startsWith('@')
        ? pkg.name.split('/')[0]
        : `@${projectName}`,
      apps,
      libs: [],
      services: [],
      sddProfile: profile,
    };

    try {
      await generateSDD(cwd, opts, {
        layout: isMonorepo ? 'nx' : 'standalone',
        nx: isNxLayout,
        mergePackageJson: true,
        absorbExistingHarness: true,
      });

      logger.success(
        'sdd/ installed (agents, skills, prompts, schemas, docs viewer, templates)',
      );
      logger.success(
        'package.json updated: sdd:* scripts + ajv/ajv-formats devDependencies',
      );
      logger.success(
        'Harness symlinks created (.claude/, .github/, .agents/, AGENTS.md, CLAUDE.md, GEMINI.md) — your own agents/skills/commands were kept; any name collision is next to yours as *.new',
      );
      logger.info(
        'Run your package manager install (pnpm install) so sdd:validate finds ajv.',
      );
      logger.info(
        'Complete the [...] markers in sdd/context/ — the project name lives ONLY in sdd/global.json.',
      );
      logger.info(
        'Create specs with `harness add spec` and validate with `pnpm sdd:validate`.',
      );
    } catch (err) {
      logger.error((err as Error).message);
      process.exit(1);
    }

    p.outro(pc.green('SDD configured.'));
  },
});

