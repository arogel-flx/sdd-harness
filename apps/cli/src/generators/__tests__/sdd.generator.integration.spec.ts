import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { resolve } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import fs from 'fs-extra';

import { generateSDD } from '../sdd.generator.js';
import { generateApp } from '../app.generator.js';
import { generateLib } from '../lib.generator.js';

// Integración real: sin mock de exec — setup-agents.sh corre de verdad y el
// sdd/ generado se valida con el validate-sdd.mjs del propio kit.
const REPO_ROOT = resolve(__dirname, '../../..');

describe.skipIf(process.platform === 'win32')(
  'sdd.generator (integration)',
  () => {
    let ws: string;

    beforeAll(async () => {
      ws = mkdtempSync(resolve(tmpdir(), 'harness-sdd-int-'));

      await generateSDD(ws, {
        projectName: 'smoke-proj',
        description: 'Smoke test project used to validate the generated SDD kit.',
        packageScope: '@smoke',
        apps: [
          { name: 'portal', type: 'react' },
          { name: 'orders-api', type: 'springboot' },
        ],
        libs: [{ name: 'shared-types', type: 'shared-types' }],
        services: [],
      });

      await generateApp(ws, { name: 'portal', type: 'react' }, '@smoke');
      await generateApp(ws, { name: 'orders-api', type: 'springboot' }, '@smoke');
      await generateLib(ws, { name: 'shared-types', type: 'shared-types' }, '@smoke');

      // validate-sdd.mjs importa ajv/ajv-formats: resolverlos desde este repo
      await fs.ensureDir(resolve(ws, 'node_modules'));
      for (const dep of ['ajv', 'ajv-formats', 'fast-deep-equal', 'fast-uri', 'json-schema-traverse', 'require-from-string']) {
        const src = resolve(REPO_ROOT, 'node_modules', dep);
        if (fs.existsSync(src)) {
          await fs.ensureSymlink(src, resolve(ws, 'node_modules', dep));
        }
      }
    }, 30_000);

    afterAll(() => {
      rmSync(ws, { recursive: true, force: true });
    });

    it('setup-agents crea los symlinks del arnés dual', () => {
      expect(fs.lstatSync(resolve(ws, 'AGENTS.md')).isSymbolicLink()).toBe(true);
      expect(fs.lstatSync(resolve(ws, 'CLAUDE.md')).isSymbolicLink()).toBe(true);
      expect(fs.lstatSync(resolve(ws, '.claude/agents')).isSymbolicLink()).toBe(true);
      expect(fs.lstatSync(resolve(ws, '.claude/skills')).isSymbolicLink()).toBe(true);
      expect(fs.existsSync(resolve(ws, '.github/agents'))).toBe(true);
      expect(fs.readFileSync(resolve(ws, 'AGENTS.md'), 'utf-8')).toContain('SDD');
    });

    it('setup-agents ignora los *.new del kit y limpia los links que dejó de más', () => {
      // Regresión: `update sdd` deja los conflictos como `<archivo>.new` DENTRO de sdd/, y
      // link_items linkeaba todo el directorio — así el .new quedaba expuesto como un
      // prompt/skill/agente duplicado a los cuatro arneses, y al resolver el conflicto y
      // borrarlo, el symlink quedaba colgado. Reportado en una migración real a v0.14.0.
      const kitNew = resolve(ws, 'sdd/prompts/start-sdd-cycle.prompt.md.new');
      fs.copyFileSync(resolve(ws, 'sdd/prompts/start-sdd-cycle.prompt.md'), kitNew);

      execFileSync('bash', [resolve(ws, 'sdd/scripts/setup-agents.sh')], {
        cwd: ws,
        stdio: 'ignore',
      });
      const exposed = resolve(ws, '.github/prompts/start-sdd-cycle.prompt.md.new');
      expect(fs.existsSync(exposed)).toBe(false);

      // Un repo que ya venía con el link creado por la versión anterior se repara solo,
      // resuelva el .new o no.
      fs.symlinkSync('../../sdd/prompts/start-sdd-cycle.prompt.md.new', exposed);
      const stale = resolve(ws, '.github/skills/ghost.new');
      fs.symlinkSync('../../sdd/skills/ghost.new', stale);

      execFileSync('bash', [resolve(ws, 'sdd/scripts/setup-agents.sh')], {
        cwd: ws,
        stdio: 'ignore',
      });
      expect(fs.existsSync(exposed)).toBe(false);
      expect(fs.lstatSync(stale, { throwIfNoEntry: false })).toBeUndefined();

      // Y las superficies legítimas siguen enteras.
      expect(
        fs.lstatSync(resolve(ws, '.github/prompts/start-sdd-cycle.prompt.md')).isSymbolicLink(),
      ).toBe(true);
      expect(fs.readdirSync(resolve(ws, '.github/skills')).length).toBeGreaterThan(10);

      fs.rmSync(kitNew, { force: true });
    });

    it('setup-agents siembra .github/copilot-instructions.md como archivo real y no lo pisa', () => {
      const target = resolve(ws, '.github/copilot-instructions.md');
      expect(fs.lstatSync(target).isSymbolicLink()).toBe(false);
      expect(fs.readFileSync(target, 'utf-8')).toContain('sdd:gate');
      fs.writeFileSync(target, '# mine\n');
      execFileSync('bash', [resolve(ws, 'sdd/scripts/setup-agents.sh')], { cwd: ws, stdio: 'ignore' });
      expect(fs.readFileSync(target, 'utf-8')).toBe('# mine\n');
    });

    it('setup-agents expone el arnés a Antigravity y Gemini CLI', () => {
      expect(fs.lstatSync(resolve(ws, 'GEMINI.md')).isSymbolicLink()).toBe(true);
      expect(fs.readFileSync(resolve(ws, 'GEMINI.md'), 'utf-8')).toContain('SDD');
      expect(
        fs
          .lstatSync(resolve(ws, '.agents/rules/sdd-gates.md'))
          .isSymbolicLink(),
      ).toBe(true);
      expect(
        fs
          .lstatSync(resolve(ws, '.agents/skills/sdd-orchestrator'))
          .isSymbolicLink(),
      ).toBe(true);
      expect(
        fs.existsSync(resolve(ws, '.agents/skills/sdd-orchestrator/SKILL.md')),
      ).toBe(true);
      expect(
        fs
          .lstatSync(resolve(ws, '.agent/workflows/start-sdd-cycle.md'))
          .isSymbolicLink(),
      ).toBe(true);
      expect(
        fs.existsSync(resolve(ws, '.agents/skills/sdd-steward/SKILL.md')),
      ).toBe(true);
      expect(
        fs
          .lstatSync(resolve(ws, '.agent/workflows/sdd-steward.md'))
          .isSymbolicLink(),
      ).toBe(true);
      expect(fs.existsSync(resolve(ws, '.gemini/commands/sdd-steward.toml'))).toBe(
        true,
      );
      const toml = fs.readFileSync(
        resolve(ws, '.gemini/commands/start-sdd-cycle.toml'),
        'utf-8',
      );
      expect(toml).toContain('generated by setup-agents');
      expect(toml).toContain('@{sdd/prompts/start-sdd-cycle.prompt.md}');
      const settings = JSON.parse(
        fs.readFileSync(resolve(ws, '.gemini/settings.json'), 'utf-8'),
      );
      expect(settings.context.fileName).toEqual(
        expect.arrayContaining(['GEMINI.md', 'AGENTS.md']),
      );
    });

    it('rtk queda operativo por defecto: hooks en Claude Code y Gemini CLI + sdd/tools.json', async () => {
      const claude = await fs.readJSON(resolve(ws, '.claude/settings.json'));
      const bash = claude.hooks.PreToolUse.find((entry: { matcher: string }) => entry.matcher === 'Bash');
      expect(bash.hooks[0].command).toContain('sdd/scripts/rtk-hook.mjs');
      const gemini = await fs.readJSON(resolve(ws, '.gemini/settings.json'));
      expect(gemini.hooks.BeforeTool[0].matcher).toBe('run_shell_command');
      expect(gemini.hooks.BeforeTool[0].hooks[0].command).toContain('sdd/scripts/rtk-hook.mjs');
      const tools = await fs.readJSON(resolve(ws, 'sdd/tools.json'));
      expect(tools.rtk.enabled).toBe(true);
    });

    it('las rules de Antigravity quedan bajo el cap de 12k caracteres', () => {
      const rulesDir = resolve(ws, 'sdd/dual-harness/rules');
      const rules = fs.readdirSync(rulesDir);
      expect(rules.length).toBeGreaterThan(0);
      for (const rule of rules) {
        const content = fs.readFileSync(resolve(rulesDir, rule), 'utf-8');
        expect(content.length).toBeLessThan(12000);
        expect(content).toContain('trigger: always_on');
      }
    });

    it('global.json registra apps y libs como mapas (de ahí los descubre el visor)', async () => {
      const global = await fs.readJSON(resolve(ws, 'sdd/global.json'));
      expect(Object.keys(global.monorepo.apps).sort()).toEqual([
        'orders-api',
        'portal',
      ]);
      expect(global.monorepo.libs).toEqual({
        'shared-types': 'libs/shared-types — shared-types',
      });
    });

    it('el sdd/ generado pasa validate-sdd.mjs (schemas + portabilidad + catálogo)', () => {
      const output = execFileSync(
        'node',
        [resolve(ws, 'sdd/scripts/validate-sdd.mjs')],
        { encoding: 'utf-8' },
      );
      expect(output).toContain('OK');
    });

    it('el blueprint java-api queda renombrado sin restos de example-api', () => {
      let leftovers = '';
      try {
        leftovers = execFileSync(
          'grep',
          ['-rl', '-e', 'example-api', '-e', 'exampleapi', resolve(ws, 'apps/orders-api')],
          { encoding: 'utf-8' },
        );
      } catch {
        // grep exits 1 when there are no matches — that is the expected outcome
      }
      expect(leftovers).toBe('');
    });
  },
);

describe.skipIf(process.platform === 'win32')(
  'sdd.generator standalone + existing project (integration)',
  () => {
    let ws: string;

    const linkAjv = async (root: string) => {
      await fs.ensureDir(resolve(root, 'node_modules'));
      for (const dep of ['ajv', 'ajv-formats', 'fast-deep-equal', 'fast-uri', 'json-schema-traverse', 'require-from-string']) {
        const src = resolve(REPO_ROOT, 'node_modules', dep);
        if (fs.existsSync(src)) {
          await fs.ensureSymlink(src, resolve(root, 'node_modules', dep));
        }
      }
    };

    beforeAll(() => {
      ws = mkdtempSync(resolve(tmpdir(), 'harness-sdd-modes-'));
    });

    afterAll(() => {
      rmSync(ws, { recursive: true, force: true });
    });

    it('layout standalone pasa validate-sdd.mjs con la app lógica única', async () => {
      const root = resolve(ws, 'standalone');
      await fs.ensureDir(root);

      await generateSDD(
        root,
        {
          projectName: 'solo-api',
          description: 'Standalone integration smoke.',
          packageScope: '@solo-api',
          apps: [{ name: 'solo-api', type: 'springboot' }],
          libs: [],
          services: [],
        },
        { layout: 'standalone', mergePackageJson: true },
      );

      expect(fs.existsSync(resolve(root, '.nxignore'))).toBe(false);
      expect(
        fs.lstatSync(resolve(root, 'AGENTS.md')).isSymbolicLink(),
      ).toBe(true);

      await linkAjv(root);
      const output = execFileSync(
        'node',
        [resolve(root, 'sdd/scripts/validate-sdd.mjs')],
        { encoding: 'utf-8' },
      );
      expect(output).toContain('OK');
    });

    it('un proyecto llamado como una palabra del kit no dispara el check de portabilidad', async () => {
      // Regresión: el check compara el nombre del proyecto contra los archivos del kit
      // con word-boundary, así que un repo llamado `legacy` fallaba en instalación limpia
      // porque templates/README.md habla de "legacy `paths`" de TypeScript. Un archivo
      // byte-idéntico al que shippeó el kit no puede haber filtrado nada.
      const root = resolve(ws, 'legacy-named');
      await fs.ensureDir(root);

      await generateSDD(
        root,
        {
          projectName: 'legacy',
          description: 'Repo heredado que se migra por partes.',
          packageScope: '@legacy',
          apps: [{ name: 'legacy', type: 'fastify' }],
          libs: [],
          services: [],
        },
        { layout: 'standalone', mergePackageJson: true },
      );

      await linkAjv(root);
      const output = execFileSync(
        'node',
        [resolve(root, 'sdd/scripts/validate-sdd.mjs')],
        { encoding: 'utf-8' },
      );
      expect(output).toContain('OK');

      // Y la regla conserva los dientes: filtrar el nombre a mano en un archivo del kit
      // cambia su hash, así que vuelve a entrar al escaneo y falla.
      const skill = resolve(root, 'sdd/skills/sdd-file-structure/SKILL.md');
      await fs.appendFile(skill, '\n<!-- proyecto: legacy -->\n');
      expect(() =>
        execFileSync('node', [resolve(root, 'sdd/scripts/validate-sdd.mjs')], {
          encoding: 'utf-8',
          stdio: 'pipe',
        }),
      ).toThrow(/hardcodes global.json/);
    });

    it('absorbe AGENTS.md/CLAUDE.md previos dentro de sdd/dual-harness', async () => {
      const root = resolve(ws, 'existing');
      await fs.ensureDir(root);
      await fs.writeFile(
        resolve(root, 'AGENTS.md'),
        '# Reglas históricas\n\nUsar siempre pnpm.\n',
        'utf-8',
      );
      await fs.writeFile(
        resolve(root, 'CLAUDE.md'),
        '# Notas Claude\n\nNo tocar la carpeta legacy/.\n',
        'utf-8',
      );

      await generateSDD(
        root,
        {
          projectName: 'legacy-repo',
          description: 'Existing repo integration smoke.',
          packageScope: '@legacy-repo',
          apps: [{ name: 'legacy-repo', type: 'app' }],
          libs: [],
          services: [],
        },
        {
          layout: 'standalone',
          mergePackageJson: true,
          absorbExistingHarness: true,
        },
      );

      // Los originales ahora son symlinks al dual-harness
      expect(fs.lstatSync(resolve(root, 'AGENTS.md')).isSymbolicLink()).toBe(true);
      expect(fs.lstatSync(resolve(root, 'CLAUDE.md')).isSymbolicLink()).toBe(true);
      // y GEMINI.md, que no existía, también quedó enlazado: la raíz nunca queda sin instrucciones
      expect(fs.existsSync(resolve(root, 'GEMINI.md'))).toBe(true);

      // El contenido previo quedó absorbido, no perdido
      const agents = fs.readFileSync(
        resolve(root, 'sdd/dual-harness/AGENTS.md'),
        'utf-8',
      );
      expect(agents).toContain('Instrucciones previas del proyecto');
      expect(agents).toContain('Usar siempre pnpm.');

      const claude = fs.readFileSync(
        resolve(root, 'sdd/dual-harness/CLAUDE.md'),
        'utf-8',
      );
      expect(claude).toContain('No tocar la carpeta legacy/.');

      // package.json creado desde cero con el arnés
      const pkg = fs.readJSONSync(resolve(root, 'package.json'));
      expect(pkg.name).toBe('legacy-repo');
      expect(pkg.scripts['sdd:validate']).toBeDefined();
      expect(pkg.devDependencies['ajv']).toBeDefined();
    });
  },
);

// Bug del uso real (2026-09-02): `configure sdd` sobre un repo con su propio arnés (.claude/,
// .github/, AGENTS.md…) lo destruía — setup-agents.sh hacía `rm -rf` de los directorios reales
// y un segundo `configure sdd` perdía lo absorbido. Regla 9: configure sdd nunca destruye.
describe.skipIf(process.platform === 'win32')(
  'setup-agents nunca destruye el arnés propio del repo (integration)',
  () => {
    let ws: string;

    const seedTeamHarness = async (root: string) => {
      const files: Record<string, string> = {
        'AGENTS.md': '# Team AGENTS\n\nRule: never touch prod.\n',
        'CLAUDE.md': '# Team CLAUDE\n\nUse pnpm.\n',
        '.claude/agents/team-agent.md': '---\nname: team-agent\n---\nTeam agent.\n',
        '.claude/skills/team-skill/SKILL.md': '---\nname: team-skill\n---\nTeam skill.\n',
        '.claude/commands/deploy.md': 'Deploy prompt.\n',
        '.github/agents/team.agent.md': 'Copilot team agent.\n',
        '.github/skills/sdd-reviewer/SKILL.md': 'Our OWN reviewer skill.\n',
        '.github/skills/team-skill/SKILL.md': 'gh team skill\n',
        '.github/prompts/review-cycle.prompt.md': 'Our own review prompt.\n',
        '.agents/skills/sdd-orchestrator/SKILL.md': 'Our OWN orchestrator skill.\n',
        '.agents/rules/team.md': 'team rule\n',
      };
      for (const [rel, content] of Object.entries(files)) {
        await fs.outputFile(resolve(root, rel), content, 'utf-8');
      }
      await fs.writeJSON(resolve(root, 'package.json'), {
        name: 'team-repo',
        version: '1.0.0',
        private: true,
      });
      return files;
    };

    const opts = {
      projectName: 'team-repo',
      description: 'Existing repo with its own agents, skills and instructions.',
      packageScope: '@team-repo',
      apps: [{ name: 'team-repo', type: 'react' }],
      libs: [],
      services: [],
    };

    beforeAll(() => {
      ws = mkdtempSync(resolve(tmpdir(), 'harness-sdd-keep-'));
    });

    afterAll(() => {
      rmSync(ws, { recursive: true, force: true });
    });

    it('configure sdd conserva agentes, skills y commands propios y deja *.new en las colisiones', async () => {
      const root = resolve(ws, 'configure');
      await fs.ensureDir(root);
      const seeded = await seedTeamHarness(root);

      await generateSDD(root, opts, {
        layout: 'standalone',
        mergePackageJson: true,
        absorbExistingHarness: true,
      });

      // Nada propio se pierde
      for (const rel of Object.keys(seeded).filter((f) => !/^(AGENTS|CLAUDE)\.md$/.test(f))) {
        expect(fs.readFileSync(resolve(root, rel), 'utf-8'), rel).toBe(seeded[rel]);
        expect(fs.lstatSync(resolve(root, rel)).isSymbolicLink(), rel).toBe(false);
      }

      // El kit queda enlazado DENTRO de los directorios reales
      expect(fs.lstatSync(resolve(root, '.claude/agents')).isSymbolicLink()).toBe(false);
      expect(fs.lstatSync(resolve(root, '.claude/agents/sdd-orchestrator.agent.md')).isSymbolicLink()).toBe(true);
      expect(fs.readFileSync(resolve(root, '.claude/agents/sdd-orchestrator.agent.md'), 'utf-8')).toContain('sdd-orchestrator');
      expect(fs.lstatSync(resolve(root, '.claude/skills/sdd-functional')).isSymbolicLink()).toBe(true);
      expect(fs.existsSync(resolve(root, '.claude/skills/sdd-functional/SKILL.md'))).toBe(true);
      expect(fs.lstatSync(resolve(root, '.claude/commands/start-sdd-cycle.prompt.md')).isSymbolicLink()).toBe(true);
      expect(fs.lstatSync(resolve(root, '.github/agents/sdd-reviewer.agent.md')).isSymbolicLink()).toBe(true);
      expect(fs.lstatSync(resolve(root, '.github/skills/sdd-functional')).isSymbolicLink()).toBe(true);

      // Colisiones: lo tuyo se queda, el kit al lado como .new (nota para dirs, copia para archivos)
      expect(fs.readFileSync(resolve(root, '.github/skills/sdd-reviewer/SKILL.md'), 'utf-8')).toBe('Our OWN reviewer skill.\n');
      expect(fs.readFileSync(resolve(root, '.github/skills/sdd-reviewer.new'), 'utf-8')).toContain('sdd/skills/sdd-reviewer');
      expect(fs.statSync(resolve(root, '.github/skills/sdd-reviewer.new')).isDirectory()).toBe(false);
      expect(fs.readFileSync(resolve(root, '.agents/skills/sdd-orchestrator.new'), 'utf-8')).toContain('sdd/skills/sdd-orchestrator');
      expect(fs.readFileSync(resolve(root, '.github/prompts/review-cycle.prompt.md'), 'utf-8')).toBe('Our own review prompt.\n');
      expect(fs.readFileSync(resolve(root, '.github/prompts/review-cycle.prompt.md.new'), 'utf-8')).toContain('review');

      // Raíz: absorbidos y symlinkeados (configure sdd los lee antes de enlazar)
      expect(fs.lstatSync(resolve(root, 'AGENTS.md')).isSymbolicLink()).toBe(true);
      const dual = fs.readFileSync(resolve(root, 'sdd/dual-harness/AGENTS.md'), 'utf-8');
      expect(dual).toContain('Instrucciones previas del proyecto');
      expect(dual).toContain('never touch prod');
      expect(fs.readFileSync(resolve(root, 'sdd/dual-harness/CLAUDE.md'), 'utf-8')).toContain('Use pnpm');
    });

    it('un segundo configure sdd (reset) conserva lo absorbido sin duplicarlo', async () => {
      const root = resolve(ws, 'configure');
      await generateSDD(root, opts, {
        layout: 'standalone',
        mergePackageJson: true,
        absorbExistingHarness: true,
      });
      const dual = fs.readFileSync(resolve(root, 'sdd/dual-harness/AGENTS.md'), 'utf-8');
      expect(dual).toContain('never touch prod');
      expect(dual.split('Instrucciones previas del proyecto').length - 1).toBe(1);
      expect(dual.split('never touch prod').length - 1).toBe(1);
      // y los archivos propios siguen ahí después del reset
      expect(fs.readFileSync(resolve(root, '.claude/agents/team-agent.md'), 'utf-8')).toContain('Team agent');
    });

    it('setup-agents solo (update sdd / pnpm setup:agents) conserva un AGENTS.md real y deja AGENTS.md.new', async () => {
      const root = resolve(ws, 'setup-only');
      await fs.ensureDir(root);
      await generateSDD(root, opts, { layout: 'standalone', mergePackageJson: true });
      // El equipo reemplazó el symlink por un archivo real (o instaló el kit a mano)
      await fs.remove(resolve(root, 'AGENTS.md'));
      await fs.writeFile(resolve(root, 'AGENTS.md'), '# Hand-written\n', 'utf-8');

      const output = execFileSync('bash', [resolve(root, 'sdd/scripts/setup-agents.sh')], {
        encoding: 'utf-8',
      });

      expect(fs.lstatSync(resolve(root, 'AGENTS.md')).isSymbolicLink()).toBe(false);
      expect(fs.readFileSync(resolve(root, 'AGENTS.md'), 'utf-8')).toBe('# Hand-written\n');
      expect(fs.readFileSync(resolve(root, 'AGENTS.md.new'), 'utf-8')).toContain('SDD');
      expect(output).toContain('conflict (kept yours): AGENTS.md');
      expect(output).toContain('1 item(s) kept as yours');
      expect(output).not.toContain('replaced');
    });
  },
);
