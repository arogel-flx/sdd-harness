export { USAGE_TABS } from './usage.en';
import type { Mode, HermesPhase, Command, Agent, Gate, ViewerShot, Harness } from './content';
import type { TreeNode } from './content';

export { TERMINAL_SCRIPT } from './content';
export type { TreeNode, TerminalLine, Mode, HermesPhase, Command, Agent, Gate, ViewerShot, Harness } from './content';

const SDD_TREE: TreeNode = {
  name: 'sdd/',
  accent: true,
  note: 'complete SDD system',
  children: [
    { name: 'global.json', note: 'single source of the name and module state' },
    { name: 'agents/', note: '7 cycle agents + sdd-steward' },
    { name: 'skills/', note: '19 skills' },
    { name: 'prompts/', note: 'gates as slash commands' },
    { name: 'schemas/', note: 'strict JSON Schema — additionalProperties: false' },
    { name: 'scripts/', note: 'spec-gate.mjs (SPEC GATE) · validate · rebuild · setup' },
    { name: 'docs/', note: 'zero-dependency viewer' },
    { name: 'memory/', note: 'lessons + journal — MEMORIA GATE' },
    { name: 'templates/', note: 'scaffolding blueprints' },
    { name: 'dual-harness/', note: 'layer 1: AGENTS.md + CLAUDE.md + GEMINI.md (~22 KB) + copilot-instructions.md' },
    { name: 'dual-harness/rules/', note: 'layer 2: canonical gates + telemetry' },
    { name: 'specs/ · context/ · fixes/', note: 'specs, per-subproject context, fixes' },
    { name: 'specs/[spec]/cycles/cycle-XX/', note: 'brief · functional · planner · architect · plan.md (lite flow) · cycle.json · tasks.json · artifacts/' },
    { name: 'api.json · components.json · schema.json', note: 'architecture registries: endpoints, components, tables' },
    { name: 'tasks.json · fixes.json · catalog.json', note: 'aggregated indexes — the viewer reads these' },
    { name: 'kit.json · pricing.json', note: 'hashes for update sdd · Costs rates' },
    { name: 'tools.json', note: 'rtk switch' },
    { name: 'documentation/', note: 'INSTALL · HOW-TO · README — in es/ and en/' },
    { name: 'README.md', note: 'bilingual documentation index' },
  ],
};

export const MODES: Mode[] = [
  {
    id: 'nx',
    label: 'Nx monorepo',
    command: 'harness init',
    claim: 'A full workspace for teams: multiple apps, shared libs.',
    detail:
      'Root config derived from the portable kit (Nx 23 + pnpm 10, apps/* libs/* tools/* globs). The react and springboot apps come from the kit blueprints; multi-provider harness symlinks and initial commit included. This tree is the real flexi-market/ example from the examples repo.',
    tree: [
      {
        name: 'flexi-market/',
        children: [
          {
            name: 'apps/',
            children: [
              { name: 'portal/', note: 'react · react-app blueprint' },
              { name: 'orders-api/', note: 'springboot · hexagonal Maven' },
            ],
          },
          { name: 'libs/', note: 'shared-types · ts-lib blueprint' },
          { name: 'tools/' },
          SDD_TREE,
          {
            name: '.claude/ · .github/ · .agents/ · .agent/ · .gemini/',
            note: 'symlinked harness — Claude Code, Copilot and Gemini',
          },
          { name: 'AGENTS.md → sdd/dual-harness/', note: 'symlink' },
          { name: 'CLAUDE.md → sdd/dual-harness/', note: 'symlink' },
          { name: 'GEMINI.md → sdd/dual-harness/', note: 'symlink' },
          { name: '.nxignore', note: 'keeps blueprints off the graph' },
          { name: 'nx.json · pnpm-workspace.yaml · tsconfig.base.json' },
          { name: 'eslint.config.mjs · docker-compose.yml · .env.example' },
        ],
      },
    ],
    example: {
      title: 'A working day in this mode',
      lines: [
        '$ harness add app nestjs --name payments-api',
        '$ harness add spec payments --author jdoe',
        '# from your agent (Claude Code / Copilot / Gemini):',
        '/start-sdd-cycle.prompt payments',
        '→ orchestrator → functional → planner+architect → implementors → reviewer',
      ],
    },
  },
  {
    id: 'standalone',
    label: 'Standalone',
    command: 'harness init --standalone',
    claim: 'ONE app with its code at the repo root. No Nx, no extra layers.',
    detail:
      'The repo registers in the SDD registries as a single logical app apps/<name> — schemas stay intact and every gate works the same. Seven types: react, springboot, nestjs, nextjs, fastify, hono, python. This tree is the real pulse-api/ example from the examples repo.',
    tree: [
      {
        name: 'pulse-api/',
        children: [
          { name: 'src/', note: 'code lives at the root — fastify + tsx' },
          { name: 'package.json', note: 'sdd:* scripts + dev/build/test' },
          { name: 'tsconfig.json · docker-compose.yml · .env.example' },
          SDD_TREE,
          {
            name: '.claude/ · .github/ · .agents/ · .agent/ · .gemini/',
            note: 'symlinked harness — Claude Code, Copilot and Gemini',
          },
          { name: 'AGENTS.md → sdd/dual-harness/', note: 'symlink' },
          { name: 'GEMINI.md → sdd/dual-harness/', note: 'symlink' },
        ],
      },
    ],
    example: {
      title: 'A working day in this mode',
      lines: [
        '$ npx @e-burgos/sdd-harness init --standalone',
        '? app type → fastify (code lives at the root)',
        '$ harness add spec catalog --author jdoe',
        '# same SDD cycle, same traceability — no extra layers',
      ],
    },
  },
  {
    id: 'harness',
    label: 'SDD harness',
    command: 'harness configure sdd',
    claim: 'Just the methodology, on a project that already exists. Without touching your code.',
    detail:
      "Detects the repo shape (Nx vs standalone), merges the sdd:* scripts into your package.json without overwriting anything, and absorbs your existing AGENTS.md/CLAUDE.md/GEMINI.md into sdd/dual-harness/ before creating the symlinks, and keeps your own agents, skills and commands under .claude/, .github/ and .agents/ (the kit is linked next to them; every collision lands as *.new): no instruction gets lost. This tree is the real legacy-shop/ example from the examples repo, generated from its versioned seed.",
    tree: [
      {
        name: 'legacy-shop/',
        children: [
          { name: 'src/', note: 'your code, untouched — byte for byte' },
          {
            name: 'package.json',
            note: 'your scripts + merged sdd:*, version preserved',
          },
          SDD_TREE,
          {
            name: 'sdd/dual-harness/AGENTS.md',
            note: 'includes your previous rules, absorbed',
          },
          {
            name: '.claude/ · .github/ · .agents/ · .agent/ · .gemini/',
            note: 'symlinked harness — Claude Code, Copilot and Gemini',
          },
        ],
      },
    ],
    example: {
      title: 'A working day in this mode',
      lines: [
        '$ cd my-legacy-repo',
        '$ npx @e-burgos/sdd-harness configure sdd',
        '→ previous AGENTS.md absorbed — no rule gets lost',
        '$ harness idea "migrate the reports module to async"',
        '# the agent runs a gap analysis vs your real stack and drafts the plan',
      ],
    },
  },
];

export const HERMES_PHASES: HermesPhase[] = [
  {
    id: 'idea',
    label: '01 · Idea',
    title: 'You register the idea — in natural language',
    body: 'One command versions the idea next to the protocol the agent will follow, with the human checkpoints marked. On an empty repo it also leaves the stack stub and its JSON Schema.',
    code: [
      '$ npx @e-burgos/sdd-harness idea "a booking app',
      '    for hair salons with reminders"',
      '',
      '✓ harness.idea.md             # the idea + the protocol',
      '✓ harness.config.json         # stack stub',
      '✓ harness.config.schema.json  # validate without the CLI',
    ],
  },
  {
    id: 'stack',
    label: '02 · Stack',
    title: 'The agent proposes the stack — you approve',
    body: 'The sdd-hermes skill decision matrix maps needs → pieces (apps, libs, Docker services). Mandatory human checkpoint: nothing is generated without your OK.',
    code: [
      '// harness.config.json — filled in by the agent',
      '{',
      '  "mode": "nx",',
      '  "apps": [{ "name": "api", "type": "nestjs" },',
      '           { "name": "webapp", "type": "react" }],',
      '  "services": [{ "type": "postgres" }]',
      '}',
    ],
  },
  {
    id: 'workspace',
    label: '03 · Workspace',
    title: 'It generates itself — zero prompts',
    body: 'The non-interactive init path: zod-validated config, errors with exact paths, and the full workspace with the SDD system installed, validated and committed.',
    code: [
      '$ npx @e-burgos/sdd-harness init --config ./harness.config.json',
      '',
      '→ Generating nx workspace...',
      '→ Installing SDD system (8 agents, 19 skills)...',
      '✓ sdd:validate OK — registries green',
    ],
  },
  {
    id: 'specs',
    label: '04 · Specs',
    title: 'One spec per module — the contract',
    body: 'The agent drafts one spec per core module from the discovery. The spec is the contract: you approve (or edit) it before the loop implements. SPEC GATE: no spec, no code.',
    code: [
      '$ harness add spec auth --author eburgos',
      '$ harness add spec bookings --author eburgos',
      '',
      'sdd/specs/spec-eburgos-001-auth/',
      'sdd/specs/spec-eburgos-002-bookings/',
    ],
  },
  {
    id: 'loop',
    label: '05 · Loop',
    title: 'The cycle loop runs — and is resumable',
    body: 'Module by module, the 7 agents do their phase with every gate active. State lives in the registries, not the session: any future session resumes exactly where it left off. With the solo profile the loop runs lite cycles: a single actor opens, implements and closes every module — same gates, same invariants.',
    code: [
      'while there are pending modules:',
      '  orchestrator → pnpm sdd:gate + cycle.json (SPEC GATE)',
      '  5 agents     → design, tasks, code, review',
      '  close        → context + memory + telemetry',
      '',
      '# session cut short? in the next one:',
      '$ sdd/prompts/hermes-resume.prompt.md',
    ],
  },
];

export const COMMANDS: Command[] = [
  {
    name: 'init',
    usage: 'harness init [--name] [--mode nx|standalone] [--standalone] [--config <file>] [--profile team|solo] [--here] [--dir <path>] [--skip-verify] [-y]',
    summary: 'Generates a repo from scratch: Nx monorepo or standalone app.',
    points: [
      'Guided prompts: name, description, mode, apps, libs, Docker services.',
      '--config <file .json|.mjs|.js>: 100% non-interactive path for AI agents and CI — zod-validated config (mode, project, apps, libs, services, sdd — including sdd.profile —, npm) and zero prompts.',
      '--profile team|solo: the working profile, written to sdd/global.json → profile. team (default) opens cycles in the full flow; solo opens them in the lite flow (a single actor, plan.md instead of the four documents). With --config, sdd.profile wins. If not passed the key is not written and the repo stays on team.',
      '--here (or --dir .) generates in the current directory instead of ./<name>; also inferred when the --config lives in the cwd or basename(cwd) == the project name — no longer nests <name>/<name>/ when the dev already ran git init and harness idea in the folder.',
      'If the cwd is already a git repo it skips git init: it commits on the current branch and merges a pre-existing .gitignore instead of overwriting it.',
      'Finishes by running the FASE 3 gate (sdd:validate + nx run-many -t lint test build, or the lint/test/build scripts in standalone): if anything is red, init fails (exit 1) and skips the initial commit. --skip-verify skips it.',
      'Generates a root README.md (apps with type/port/command) if missing, and always a .env.example — with <APP>_PORT per app in addition to the services.',
      'SDD always included — it is not optional.',
    ],
  },
  {
    name: 'idea',
    usage: 'harness idea ["<idea in natural language>"] [--author <gh-user>] [--show] [--force]',
    summary: 'The entry point of the hermes end-to-end flow: from an idea to a product.',
    points: [
      'Persists harness.idea.md: the idea verbatim + a self-sufficient protocol for FASE 1–3 (need→piece decision matrix, standalone vs nx, the init command with the note on generating in the cwd) — because on an empty repo the sdd-hermes skill does not exist yet. Now it also includes the ## Evidencia del descubrimiento and ## Decisiones del dev sections, which the agent fills during FASE 1 and the specs cite.',
      '--author <gh-user>: lands in sdd.author of the config stub and in the idea file header — signs the specs (add spec / sdd.modules).',
      '--show: prints the registered idea, the evidence table and the decisions — to resume work with hermes-resume without rereading the whole file.',
      'On an empty repo it also leaves the harness.config.json stub (with apps[0].port and sdd: { author?, modules: [] }) and its JSON Schema, ready for init --config.',
      'Inside an existing SDD workspace, the protocol switches to gap analysis (harness add app|service|spec).',
      'The intelligence lives in the kit sdd-hermes skill — the command materializes the deterministic entry point.',
    ],
  },
  {
    name: 'config schema',
    usage: 'harness config schema [--out <file>]',
    summary: 'Prints the JSON Schema of the init --config contract.',
    points: [
      'Derived from the same zod schema the CLI validates with: agents and editors validate configs without running it.',
      "apps[].port is now honored: it flows into the app's own code default (per-app env var, e.g. catalog-api → CATALOG_API_PORT), into .env.example and into the README.",
      'sdd.author (GitHub user) and sdd.modules (slugs or objects { name, title?, description?, app?, apps?, depends_on? }): each module is seeded as a draft spec + a pending_modules entry when init runs.',
      'npm.scopes: [{ scope, registry }] generates the @org:registry=… lines of the .npmrc — URL only; the credential lives in the local ~/.npmrc and NODE_AUTH_TOKEN in CI.',
    ],
  },
  {
    name: 'add app',
    usage: 'harness add app [type] --name <name>',
    summary: 'Adds an app to an existing workspace.',
    points: [
      'react and springboot come from the sdd/templates/ blueprints of the repo itself.',
      'Registers the app in sdd/global.json and creates its subproject context.',
    ],
  },
  {
    name: 'add tool',
    usage: 'harness add tool [name] --type <what it is>',
    summary: 'Registers a tool as an SDD subproject. It generates no code.',
    points: [
      'Writes the entry in sdd/global.json → monorepo.tools (the key is created with the first tool: it is optional in the schema) and creates sdd/context/tools/<name>/ with constitution.md, context_prompt.md and updates/.',
      'A tool is whatever the team writes under tools/<name>/ — scripts, internal CLIs, generators. The command supplies what was missing for it to exist as a subproject: its registration and its context.',
      'With that the viewer lists it under Context and on the Dashboard, and SPEC GATE B can require its constitution.md when a cycle touches it.',
    ],
  },
  {
    name: 'add spec',
    usage: 'harness add spec [slug] --author <gh-user> --title <t> --app apps/<n> [--apps <a,b>] [--depends-on <id|slug>] [--description <t>]',
    summary: 'Creates a spec with the multi-developer v2.0 convention.',
    points: [
      'spec-[author]-[NNN]-[slug]/ structure with cycles/ and fixes/. Per-author NNN counter and registration in sdd/specs/index.json with status: draft (draft | in-progress | completed | cancelled) — the orchestrator moves it to in-progress when it opens cycle-01.',
      '--apps apps/a,libs/b (repeatable or comma-separated): every subproject the module touches, in addition to the main --app.',
      '--depends-on <spec-id|slug> (repeatable/comma-separated): resolved against sdd/specs/index.json.',
      'Automatically registers the module in pending_modules of sdd/global.json ({ module, spec, apps, cycles_completed: 0, description }) — previously it had to be written by hand.',
      'Validates the registries when done (sdd:validate).',
    ],
  },
  {
    name: 'add skill',
    usage: 'harness add skill [name] --description <text>',
    summary: 'Creates a new skill under sdd/skills/.',
    points: [
      'Uppercase SKILL.md file — the Agent Skills standard, required by Claude Code.',
      'With name/description frontmatter ready for all three consumers: Claude Code, Copilot and Gemini CLI.',
    ],
  },
  {
    name: 'add service',
    usage: 'harness add service [type]',
    summary: 'Adds a service to docker-compose.yml.',
    points: ['postgres · redis · rabbitmq · minio, with healthchecks.'],
  },
  {
    name: 'configure sdd',
    usage: 'harness configure sdd --name <n> --description <d> [--profile team|solo] [--apps name=path,...]',
    summary: 'Installs (or resets) the SDD system on an existing project.',
    points: [
      'Shape detection: monorepo (apps/ or nx.json) or standalone repo. In a monorepo it registers the apps under apps/ plus every project.json of type application elsewhere (src/<name>...); --apps name=path,... declares them by hand. With no app found it fails instead of installing an empty kit.',
      'Monorepo without Nx: a repo with apps/ (or --apps) but no nx.json is registered all the same, but gets no .nxignore and is not labelled Nx in global.json.',
      'Subproject ids are normalised to what the registries accept: @acme/api → api, Api_Gateway → api-gateway, 2fa → app-2fa. Two apps mapping to the same id is an error.',
      'Automatic package.json merge + absorption of the previous harness.',
      'No prompts with --name and --description: an agent can run it.',
      '--profile team|solo: the same profile as in init — written to sdd/global.json → profile only when passed (absent = team, full cycles).',
    ],
  },
  {
    name: 'update sdd',
    usage: 'npx @e-burgos/sdd-harness@latest update sdd [-y]',
    summary: 'Updates the installed SDD kit while preserving everything of yours.',
    points: [
      'Hash baseline in sdd/kit.json: untouched files get replaced, customized ones are preserved (the new version lands as .new).',
      'Your data (specs, cycles, fixes, contexts, registries) is never touched.',
      'Finishes with setup:agents, catalog rebuild and sdd:validate.',
    ],
  },
  {
    name: 'configure docker / mcp',
    usage: 'harness configure docker · harness configure mcp',
    summary: 'Regenerates docker-compose or configures MCP servers (.mcp.json).',
    points: ['Multi-select with what is already configured preselected.'],
  },
  {
    name: 'configure memory',
    usage: 'harness configure memory',
    summary: 'Opt-in MCP memory providers on top of the kit portable base.',
    points: [
      'The base (sdd/memory: lessons.md + journal) is versioned files, zero dependencies — this adds optional semantic retrieval.',
      'basic-memory (local-first Markdown) or the official knowledge-graph persisted in sdd/memory/ (travels with git).',
      'Non-destructive .mcp.json merge: other configured servers are not touched.',
    ],
  },
  {
    name: 'info',
    usage: 'harness info',
    summary: 'Workspace X-ray: apps, services, SDD state.',
    points: ['Reads sdd/global.json: completed modules, in progress, registered apps.'],
  },
];

export const AGENTS: Agent[] = [
  { name: 'orchestrator', role: 'Runs pnpm sdd:gate, picks the flow and opens the cycle', writes: 'brief.yaml / plan.md · cycle.json' },
  { name: 'functional', role: 'Spec → user stories', writes: 'functional.md' },
  { name: 'planner', role: 'Stories → technical tasks', writes: 'planner.md · tasks.json' },
  { name: 'architect', role: 'Validates design, defines contracts', writes: 'architect.md · schema.json · api.json' },
  { name: 'implementor-back', role: 'Implements the backend, task by task', writes: 'code + api.json' },
  { name: 'implementor-front', role: 'Implements the UI against the contracts', writes: 'code + components.json' },
  { name: 'reviewer', role: 'VALIDATION GATE + cycle close', writes: 'cycle.json · context/**' },
];

export const GATES: Gate[] = [
  {
    name: 'SPEC GATE',
    rule: 'Not a single line of code without a registered spec, an open cycle, a plan and tasks — in every flow.',
    how: 'Two moments, and both are answered by a command instead of reading files by hand: pnpm sdd:gate <spec-id|slug> is GATE A, the cycle opening the orchestrator runs (spec registered in specs/index.json · module in pending_modules or in_progress_modules · no other cycle of that spec in-progress · depends_on completed · spec neither completed nor cancelled), and pnpm sdd:gate <spec-id|slug> cycle-XX is GATE B, run by whoever is about to write code (cycle.json in-progress · module in in_progress_modules · tasks.json with at least one task · the documents of THAT cycle\'s flow · constitution.md of every subproject in cycle.json.apps). It prints one ✔/✘ line per condition, ends with APPROVED or BLOCKED and exits 0/1 (--json for agents); GATE A also reports the next cycle id and the suggested flow. The invariants never change: spec registered, module in global.json, cycle.json in-progress before the first line of code, tasks.json with tasks, and no task moved to done without its usage. What changes is the shape — flow full (brief · functional · planner · architect), reduced (brief) or lite (plan.md, a single actor) — decided by sdd/global.json → profile: team opens full, solo opens lite, and a [LITE] / [FULL] prefix in the request beats the profile.',
  },
  {
    name: 'FIX GATE',
    rule: 'Urgent bugs do not wait for a full cycle — but they get registered.',
    how: '[HOTFIX] [BUGFIX] [FIX] [IMPROVEMENT] prefixes trigger a lightweight bypass with traceability in fixes.json. With profile: solo the shortcut is shorter still: no questionnaire (the actor fills fixes.json from the request itself and only asks what cannot be deduced), a minimal fix document (problem · solution · files) and eligibility reduced to "creates no new contracts or entities" — registration, usage, the context fragment and sdd:validate stay the same.',
  },
  {
    name: 'CONTEXTO GATE',
    rule: 'A cycle does not close with stale context.',
    how: 'Additive per-cycle fragments in context/**/updates/ — unique by construction, zero merge conflicts.',
  },
  {
    name: 'MEMORIA GATE',
    rule: 'What one cycle learned is never paid for twice.',
    how: 'Distilled lessons in memory/lessons.md (120-line cap, read at session start) + an append-only episodic journal the orchestrator distills at ≥5 entries.',
  },
  {
    name: 'TELEMETRÍA GATE',
    rule: 'A cycle does not close without declaring which provider and which model did the work.',
    how: 'cycle.json → metrics.usage.by_agent[] — every agent records provider_model, effort, tokens_in/out, approx and source when its own unit closes; by_tier is derived from by_agent, never reconstructed. Exact source agent-usage-notification (Claude Code: <usage><subagent_tokens>N</subagent_tokens>… when a subagent finishes); with no per-session counter (Copilot, Antigravity) it goes in as a declared estimate with approx: true — the viewer shows it as estimated, never hides it. Since 2026-09-02 the validator FAILS (previously: warning) if a cycle or fix closes without provider/model + tokens.',
  },
];

export const APP_CATALOG = [
  { type: 'react', stack: 'React 19 + Vite + Tailwind', origin: 'react-app blueprint' },
  { type: 'springboot', stack: 'Spring Boot 3.5 + Java 21, hexagonal', origin: 'java-api blueprint (Maven)' },
  { type: 'nestjs', stack: 'NestJS 11', origin: 'built-in generator' },
  { type: 'nextjs', stack: 'Next.js 15 (App Router)', origin: 'built-in generator' },
  { type: 'fastify', stack: 'Fastify 5', origin: 'built-in generator' },
  { type: 'hono', stack: 'Hono 4 + node-server', origin: 'built-in generator' },
  { type: 'python', stack: 'Python 3.11 + pyproject', origin: 'built-in generator' },
];

export const LIB_CATALOG = ['shared-types', 'shared-utils', 'ui-kit', 'api-client', 'config'];

export const SERVICE_CATALOG = ['postgres', 'redis', 'rabbitmq', 'minio'];

export const SDD_SCRIPTS = [
  { cmd: 'pnpm sdd:validate', what: 'Validates ALL registries against their schemas + cross-checks + the portability rule' },
  { cmd: 'pnpm sdd:gate', what: 'Answers the SPEC GATE: <spec-id|slug> to open a cycle (GATE A) and <spec-id|slug> cycle-XX to authorize code (GATE B). One line per condition, APPROVED/BLOCKED, exit 0/1 and --json for agents' },
  { cmd: 'pnpm sdd:docs', what: 'The SDD system viewer — vanilla JS, zero dependencies, works offline' },
  { cmd: 'pnpm setup:agents', what: 'Multi-provider harness symlinks: .claude/, .github/, .agents/, .agent/, .gemini/, AGENTS.md, CLAUDE.md, GEMINI.md' },
  { cmd: 'pnpm sdd:rebuild-tasks-index', what: 'Regenerates the tasks index from the per-cycle tasks.json files' },
  { cmd: 'pnpm sdd:rebuild-catalog', what: 'Regenerates the manifest the viewer consumes' },
];

export const HARNESSES: Harness[] = [
  {
    name: 'Claude Code',
    tagline: 'programmatic enforcement',
    reads: [
      'CLAUDE.md → sdd/dual-harness/CLAUDE.md',
      '.claude/agents · skills · prompts · commands (SDD slash commands)',
    ],
    models:
      'Passes explicit model and effort on every subagent and workflow, following the harness canonical tier table. Reader fan-outs run on the economy tier; synthesis and review on the high tier.',
  },
  {
    name: 'GitHub Copilot',
    tagline: 'frontmatter pinning',
    reads: [
      'AGENTS.md → sdd/dual-harness/AGENTS.md',
      '.github/agents · skills · prompts (custom agents + prompt files)',
      ".github/copilot-instructions.md — a real file, not a symlink (GitHub's server-side readers do not follow them), seeded by pnpm setup:agents from sdd/dual-harness/copilot-instructions.md only when it does not exist; afterwards it belongs to the project and is never overwritten",
    ],
    models:
      'The 7 SDD agents ship with model: pinned per role in the frontmatter (Claude aliases opus/sonnet); the team maps it once to the same-tier model available in their org. In Copilot CLI: --model and --reasoning-effort.',
  },
  {
    name: 'Antigravity',
    tagline: "the user's dropdown",
    reads: [
      'GEMINI.md → sdd/dual-harness/GEMINI.md',
      '.agents/rules — the SDD gates as always-on rules',
      '.agents/skills · .agent/workflows → /start-sdd-cycle, /hermes-resume…',
    ],
    models:
      'The agent cannot switch models on its own: before executing it compares the dropdown model with the required tier and, when they differ, asks for a model or thinking-level change. It never runs silently on the wrong tier.',
  },
  {
    name: 'Gemini CLI',
    tagline: 'per-session model + /stats',
    reads: [
      'GEMINI.md + AGENTS.md (.gemini/settings.json → context.fileName)',
      '.agents/skills (SKILL.md standard, shared with Antigravity)',
      '.gemini/commands/*.toml — the SDD prompts as slash commands',
    ],
    models:
      'Per-session or per-flag model matching the tier; fan-outs run on economy subagents and synthesis on Pro. /stats reports the real session tokens — the honest source for telemetry (it is a client-side command: the agent asks the dev for it).',
  },
];

export const PORTABILITY_POINTS = [
  {
    title: 'global.json is the single source of the name',
    body: 'No other kit file hardcodes the project name or description. sdd:validate fails if they leak. That is why the kit copies verbatim between repos, with no template rendering.',
  },
  {
    title: 'Strict schemas, trustworthy registries',
    body: 'Every JSON in sdd/ validates against a schema with additionalProperties: false. A commit that leaves sdd:validate red is an invalid commit.',
  },
  {
    title: 'One harness, three assistants',
    body: 'Claude Code, GitHub Copilot and Gemini (Antigravity + Gemini CLI) read the same agents, skills and prompts via symlinks. You edit in sdd/, all three see it.',
  },
];

export const VIEWER_SHOTS: ViewerShot[] = [
  {
    id: 'costs',
    tab: 'Costos ★',
    caption:
      'The star view, now in four tabs with charts: General (agentic vs traditional, cost per agent, tokens per provider and a Source column that tells measured numbers apart from declared estimates), Specs, Fixes and RTK (how much command output rtk saved). It updates itself while the loop works.',
  },
  {
    id: 'dashboard',
    tab: 'Dashboard',
    caption:
      'Project state on one screen: specs, cycles, fixes, registered apps and the global.json monorepo block — with LOCAL · LIVE indicator and live sync.',
  },
  {
    id: 'agents',
    tab: 'Agentes',
    caption:
      'The 7 cycle agents with their full definitions rendered — the same .agent.md, with model: pinned, that Claude Code, Copilot and Gemini read, browsable.',
  },
  {
    id: 'skills',
    tab: 'Skills',
    caption:
      'The complete kit skill catalog, read from the filesystem via catalog.json — orchestration, workspace, code generators.',
  },
  {
    id: 'schemas',
    tab: 'Schemas JSON',
    caption:
      'The strict JSON Schemas of every registry, explorable field by field. What sdd:validate demands, self-documented.',
  },
  {
    id: 'help',
    tab: 'Metodología',
    caption:
      'The complete SDD system documentation (README, HOW-TO, gates) rendered inside the viewer itself.',
  },
];

export const VIEWER_SECTIONS = [
  { section: 'Overview', views: ['Dashboard', 'Planificación', 'Costos'] },
  { section: 'SDD', views: ['Specs', 'Ciclos', 'Tareas', 'Fixes', 'Contexto', 'Memoria'] },
  { section: 'SDD tooling', views: ['Agentes', 'Skills', 'Prompts'] },
  { section: 'Architecture', views: ['Schema', 'API', 'Componentes', 'Schemas JSON'] },
  { section: 'Help', views: ['Documentación SDD'] },
];

export const VIEWER_PRINCIPLES = [
  {
    title: 'Zero dependencies, zero build',
    body: 'Vanilla JS + a server built on node:* modules only. No viewer npm install, no build step, no framework going stale. You open the port and it is there.',
  },
  {
    title: 'Reads the registries live — and updates itself',
    body: 'It does not generate static HTML: it consumes global.json, specs/index.json, tasks.json and catalog.json straight from the filesystem. Locally it polls a PER-AREA fingerprint every 4s: it only re-renders your view if something it depends on changed, preserving expanded sections, searches and scroll.',
  },
  {
    title: 'The Costs dashboard',
    body: 'Four tabs, all with charts (inline SVG, no libraries) and fixed-height scrollable tables: General (KPIs, traditional vs agentic per spec, cost per agent, tokens per provider, telemetry source and methodology), Specs (cost per spec, tokens per cycle, cycle detail), Fixes (cost per type, severity, status, tokens and detail) and RTK (compressed commands, tokens generated vs read, savings with their average % and an approximate USD equivalent). The agentic cost comes from editable rates in sdd/pricing.json and a Source column marks each provider as measured or estimated, so a declared approximation never passes for a measurement.',
  },
  {
    title: 'Travels with the kit',
    body: 'sdd/docs/ is part of the sdd/ folder — copying the kit to another repo carries the methodology AND its viewer. Vendored fonts: works offline, no CDN.',
  },
  {
    title: 'A server restricted by design',
    body: 'serve.mjs only exposes /sdd/** on 127.0.0.1 — it cannot serve your app code nor listen outside localhost.',
  },
];

export const UI = {
  nav: {
    groups: [
      {
        label: 'Product',
        items: [
          { id: 'modos', label: 'The 3 modes' },
          { id: 'catalogo', label: 'Catalog' },
          { id: 'empezar', label: 'Get started' },
        ],
      },
      {
        label: 'Agents',
        items: [
          { id: 'hermes', label: 'Idea → product' },
          { id: 'steward', label: 'Day-to-day with the steward' },
          { id: 'metodologia', label: 'SDD methodology' },
          { id: 'multi-harness', label: 'Multi-harness' },
        ],
      },
      {
        label: 'The kit',
        items: [
          { id: 'kit', label: 'The portable kit' },
          { id: 'comandos', label: 'Commands' },
          { id: 'en-vivo', label: 'Live costs' },
        ],
      },
    ],
    guiaLabel: 'sdd guide',
    sddDocsMenu: 'sdd:docs — the viewer',
    guiaMenu: 'sdd guide — the full manual',
    usageLabel: 'how to use it',
    usageMenu: 'how to use it — the practical guide',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  hero: {
    kicker: 'Spec-Driven Development CLI',
    title1: 'Agent-ready repos.',
    title2: ' Specs before code.',
    body: ' generates repos with the SDD methodology built in: 7 specialized agents, gates that make it impossible to code without design, schema-validated registries and a multi-provider harness that Claude Code, GitHub Copilot and Gemini read alike.',
    cta: 'See the 3 modes',
    chips: ['8 SDD agents', '19 skills', '5 gates', 'SPEC GATE as a command', 'lite flow · solo profile', 'strict schemas', 'live costs', 'portable memory', 'Nx · standalone · existing'],
  },
  modes: {
    kicker: '01 — the three modes',
    title: 'One product, three ways in',
    lead: 'A new monorepo, a single app, or a project that already exists: the SDD system that gets installed is exactly the same.',
  },
  hermes: {
    kicker: '02 — hermes, the end-to-end',
    title: 'From a one-sentence idea to a product with specs',
    lead: 'You hand it an idea in natural language and the system configures the stack, seeds the backlog and drives the cycle loop — with human checkpoints where they matter and without bypassing a single gate.',
    loopNotePre: 'And every cycle leaves lessons in ',
    loopNotePost: ': the system learns from the project and never pays for the same discovery twice.',
  },
  live: {
    kicker: '03 — the star feature',
    title: 'A dashboard that works while the agents work',
    lead: 'Every cycle records tokens and time. The viewer turns them into a cost comparison against the traditional estimation — and locally it updates itself while the loop runs. Hit play:',
    features: [
      { t: 'Honest telemetry', d: 'At every cycle close, tokens per provider/model and minutes are recorded in cycle.json → metrics.usage — mandatory, and marked approx: true when the harness exposes no counter so estimates are declared rather than hidden. Each agent sums its own unit into by_agent when it closes; by_tier is derived from that. The agent-usage-notification source (Claude Code) is exact, not estimated. The agentic cost comes from editable rates in sdd/pricing.json; the traditional estimation, from the hours your tasks already estimate.' },
      { t: 'rtk on by default', d: 'Since kit v0.12.0 the output of shell commands (git, pnpm, vitest, tsc, eslint…) reaches the agent compressed — rtk reports 60–90% less text — without touching file reading and with zero developer action: install and update leave the hook in place. The switch lives in sdd/tools.json (pnpm sdd:rtk -- --disable), it is best effort — if the binary is missing the command still runs — and the savings show up in the RTK tab of Costs.' },
      { t: 'Less context per session (v0.13.0)', d: 'The root harness file that is always loaded went from ~32 KB to ~22 KB: the full definition of the gates and of the telemetry contract moved to sdd/dual-harness/rules/, read only when needed. In the same spirit, the SPEC GATE is answered by pnpm sdd:gate instead of reading ten files by hand, and the lite flow (solo profile) resolves a cycle with a single actor and one plan.md instead of four documents and five agents — fewer tokens per cycle, exactly the same invariants.' },
      { t: 'Surgical reactivity', d: 'The viewer polls a PER-AREA fingerprint of the registries every 4 seconds. It only re-renders your view if an area it depends on changed: closing a cycle refreshes Costs and Cycles, but never touches your Agents view.' },
      { t: 'Your UI stays intact', d: 'Expanded sections, typed searches and scroll position survive every refresh. And if you have a document open or the tab hidden, the refresh waits. On static hosting, the usual Refresh button.' },
    ],
    cta: 'See the full viewer, with real screenshots',
    demo: {
      live: 'local · live',
      tagline: '— the viewer while the loop works',
      replay: 'replay',
      pause: 'Pause simulation',
      resume: 'Resume simulation',
      kpiTasks: 'tasks done',
      kpiTokens: 'tokens',
      kpiCost: 'agentic cost',
      kpiSaving: 'savings',
      legendTraditional: 'traditional',
      legendAgentic: 'agentic',
      activity: 'loop activity',
      steps: [
        { actor: 'sdd-orchestrator', feed: 'SPEC GATE OK · opens cycle-01 (auth) · brief + cycle.json' },
        { actor: 'sdd-implementor-back', feed: 'TASK-001 done · user model · 352k tokens (claude/sonnet)' },
        { actor: 'sdd-implementor-back', feed: 'TASK-002 done · login/refresh endpoints · 608k tokens (claude/sonnet)' },
        { actor: 'sdd-architect', feed: 'TASK-003 done · review and hardening · ~171k estimated tokens (copilot/claude-sonnet · approx)' },
        { actor: 'sdd-reviewer', feed: 'closes cycle-01 ✓ · CONTEXT + MEMORY + TELEMETRY GATE · lesson → journal' },
      ],
      footnote: 'traditional = 20 estimated hours × US$ 50/h · agentic = tokens × per-provider/model rate (sdd/pricing.json). TASK-003 ran on Copilot, which exposes no per-session counter: it goes in as a declared estimate (approx: true) and the viewer shows it as estimated — the cycle mixes a measured provider with an estimated one without losing honesty. The loop activity lives in the viewer: Cycles view → open a cycle → \u201cCycle activity\u201d, reconstructed from cycle.json + tasks.json.',
      donePre: 'Cycle closed: the dashboard reflected it ',
      doneEm: 'on its own',
      doneMid: " — no reload, no clicks, and without losing what you had expanded. The cycle's projected savings: ",
      donePost: '.',
    },
  },
  commands: {
    kicker: '04 — reference',
    title: 'Commands',
    lead: 'Everything interactive with guided prompts; everything automatable with flags and -y.',
  },
  methodology: {
    kicker: '05 — the methodology',
    title: 'Seven agents, five gates, zero improvisation',
    lead: 'Every feature goes through a design cycle before touching code. The agents write verifiable artifacts; the gates demand them. In the lite flow (solo profile) a single actor wears all seven hats: opens the cycle, writes plan.md, implements task by task and closes as the reviewer — no subagent fan-out, same gates.',
    footnote1: 'specs per author: spec-jdoe-001-user-onboarding / cycles/cycle-01/',
    footnote2: 'artifacts per cycle — full: brief · functional · planner · architect · tasks · cycle / lite: plan · tasks · cycle',
  },
  multiHarness: {
    kicker: '06 — the harness',
    title: 'From dual-harness to multi-harness',
    lead: 'A single system of agents, skills, prompts and rules lives in sdd/ — and four harnesses read it equally via symlinks. Edit once; all of them see it. Each harness also has its own mechanism to honor the ⚙️ model rule.',
    readsLabel: 'What it reads',
    modelsLabel: 'Model rule (⚙️)',
    dualNote: {
      title: 'The naming caveat: it is no longer “dual”',
      body: 'The harness was born dual — Claude Code and GitHub Copilot — and its folder was named after that. Since v0.7.0 it is a multi-harness: Gemini joined with two surfaces (Antigravity IDE and Gemini CLI). The sdd/dual-harness/ directory keeps its name for compatibility (kit.json hashes and update sdd depend on that path), but inside live the three editions of the same contract — AGENTS.md, CLAUDE.md and GEMINI.md — plus the Antigravity rules in rules/ and copilot-instructions.md. Since v0.13.0 the harness comes in two layers: layer 1 is the root files, always loaded, trimmed to ~22 KB (from ~32) with the rules and gates in short form plus pointers; layer 2 is sdd/dual-harness/rules/, read when needed, holding the canonical definitions — sdd-gates.md (the full SPEC GATE, both moments, with the flows and the profile) and sdd-model-budget.md (the telemetry contract: who records what and when, the per-harness source table and the validator rules). When a gate changes, it changes in exactly one file.',
    },
    telemetryNote:
      'All four record the same telemetry, and it is mandatory: cycle.json → metrics.usage.by_agent[] (one entry per agent that closed a unit, with provider/model — claude/opus, gemini/pro, copilot/claude-sonnet; Antigravity records under gemini/*), from which by_tier is derived, plus per-task and per-fix usage. Declaring provider and model is not optional: since 2026-09-02 the validator fails (previously: warning) if it is missing. Harnesses with no per-session counter (Copilot, Antigravity) record a declared estimate with approx: true, and the Costs view shows it as estimated in the Source column — it is never omitted.',
  },
  steward: {
    kicker: '07 — the day-to-day',
    title: 'A concierge for the kit: sdd-steward',
    lead: 'Since v0.8.0 the kit ships its own entry agent. Any request about the kit — status, updates, ideas, costs, harness health — you say directly to it: it resolves it or routes it to the owning agent, without bypassing a single gate.',
    invokeNote: '/sdd-steward with no arguments runs the full status. The same command exists in all four harnesses — slash command in Claude Code, prompt in Copilot, workflow in Antigravity, TOML command in Gemini CLI — created by pnpm setup:agents.',
    examplesTitle: 'The day-to-day, one line each',
    examples: [
      { cmd: '/sdd-steward', what: 'Full status: kit version vs npm, the repo profile (team/solo) and the flow it opens by default, modules, cycles in flight, open fixes, memory, validate and symlink health' },
      { cmd: '/sdd-steward switch me to the solo profile', what: 'Changes sdd/global.json → profile and explains what changes: new cycles open lite, already-open cycles keep their flow, and a spec that creates contracts another subproject consumes goes back to full. It is the only registry the steward edits, and only on an explicit request' },
      { cmd: '/sdd-steward what does the lite flow save me?', what: 'Explains the flows from sdd/dual-harness/rules/sdd-gates.md: plan.md instead of the four documents, a single actor, the context read once — with the invariants and the close untouched' },
      { cmd: '/sdd-steward update the library', what: 'Drives update sdd with the post-update checklist: *.new conflicts, setup:agents, validate green' },
      { cmd: '/sdd-steward kick off this idea: …', what: 'Minimal intake and delegation to sdd-hermes — the idea → product loop with its human checkpoints' },
      { cmd: '/sdd-steward how much did we spend per provider?', what: 'Aggregates cycle, task and fix telemetry with the provider/model rates from pricing.json' },
      { cmd: '/sdd-steward [BUGFIX] login is broken', what: 'Classifies the prefix and routes to the FIX GATE — traceability comes from the gate, not the steward' },
      { cmd: '/sdd-steward how does the CONTEXTO GATE work?', what: 'Answers from sdd/documentation/ with surgical reading — never loading the whole kit into context' },
    ],
    manualNote: {
      title: 'It adds, it does not replace',
      body: 'The steward is a front door, not a tollbooth: everything you did by hand keeps working exactly the same — direct update sdd, /start-sdd-cycle, hermes, the viewer, every prompt and every script. Use it when you want to talk to the kit; skip it when you prefer the command.',
    },
  },
  catalog: {
    kicker: '08 — catalog',
    title: 'What it can generate',
    apps: 'Apps — 7 types',
    libs: 'Shared libs',
    services: 'Docker services',
    dockerNote: 'docker-compose.yml with healthchecks, ready to bring up the local infrastructure of the cycle.',
  },
  kit: {
    kicker: '09 — the heart',
    title: 'The portable SDD kit',
    lead: 'Everything the CLI installs lives in a single sdd/ folder copied verbatim — designed to move between repos without editing a single file.',
    scripts: 'Scripts that travel with the kit',
    linkPre: 'Get to know ',
    linkPost: ' in depth — real screenshots and the 16 views',
    update: {
      kicker: 'Updating the kit — fearlessly',
      title: 'One command brings everything new. Yours is never touched.',
      p1: 'The update is governed by the hashes in ',
      p2: ': it knows exactly which file belongs to the kit, which is yours and which one you modified. At the end it rebuilds the catalog, refreshes the symlinks and runs ',
      p3: '.',
      rows: [
        { k: 'Your data', v: 'specs, cycles, fixes, contexts, memory — never touched' },
        { k: 'Unmodified kit', v: 'silently replaced by the new version' },
        { k: 'New files', v: 'added on their own (memory, pricing, new skills…)' },
        { k: 'What you edited', v: 'stays intact; the new version lands next to it as *.new for a manual merge' },
      ],
    },
  },
  start: {
    kicker: '10 — get started',
    title: 'Three commands and you are in',
    steps: [
      { n: '01', t: 'Generate or install', c: 'npx @e-burgos/sdd-harness init', d: 'Nx monorepo or standalone. For an existing repo: harness configure sdd.' },
      { n: '02', t: 'Write your first spec — or throw an idea', c: 'harness add spec my-feature', d: 'The WHAT before the how. Or harness idea "..." and the agent drafts the whole plan (hermes flow).' },
      { n: '03', t: 'Start the cycle', c: '/start-sdd-cycle.prompt', d: 'From Claude Code, Copilot or Gemini: the orchestrator takes the spec and the cycle runs on its own.' },
    ],
    examples: {
      title: 'Rather read it first?',
      lead: 'The CLI output lives in its own repo, one example per mode: an Nx monorepo (React + Spring Boot), a standalone Fastify app, and a project that already existed and adopted SDD without touching a line of its own code. A workflow regenerates them from the published package on every release, so they never lag behind npm.',
      cta: 'Browse the examples',
    },
  },
  footer: { by: 'Built by ' },
  viewer: {
    back: 'back to the documentation',
    kicker: 'sdd:docs — the star tool',
    h1a: 'The SDD system has its own face.',
    h1b: ' And it lives inside the kit.',
    b1: 'SDD registries are JSON built for machines. ',
    b2: ' is their human face: a viewer that reads global.json, specs, cycles, tasks and catalogs ',
    bLive: 'live',
    b3: ' and turns them into a navigable dashboard — nothing to install, no build, no CDN.',
    cmdNote: '→ http://127.0.0.1:4310/sdd/docs/',
    shotAltPre: 'The ',
    shotAltPost: ' view of the sdd:docs viewer',
    realNote: 'Real screenshots of the viewer running on a workspace generated with harness init.',
    usage: {
      kicker: 'how it is used',
      title: 'One command, sixteen views',
      lead: 'The viewer installs itself — it ships inside sdd/docs/ in every generated repo. There is no setup.',
      steps: [
        { n: '01', t: 'Bring it up', c: 'pnpm sdd:docs', d: 'A node:*-modules-only server serves the viewer on port 4310. No extra npm install, no build.' },
        { n: '02', t: 'Navigate by hash', c: '#/costs · #/cycles · #/agents', d: 'Hash router with 16 views in 5 sections. Every spec, cycle, task and fix with its detail.' },
        { n: '03', t: 'Work — it updates itself', c: '__state → selective re-render', d: 'Locally it polls the registries per area every 4s: close a cycle and the active view reflects it without reloading, preserving your UI. The validator keeps it honest.' },
      ],
      viewsHeading: 'The 16 views',
    },
    principles: {
      kicker: 'why it is like this',
      title: 'Portable on purpose',
      lead: 'Every viewer decision comes from the same rule that governs the kit: copying sdd/ to another repo has to work without editing anything.',
      footNote: 'Every generated repo ships the viewer inside.',
    },
  },
  guia: {
    back: 'back to the documentation',
    kicker: 'sdd guide — the documentation that travels with the kit',
    h1a: 'The full system manual,',
    h1b: ' before installing it.',
    body: 'These documents live inside sdd/documentation/ in every generated repo, in Spanish and English — here you can read them in full: how to install and update the framework, the step-by-step guide for a dev day-to-day, and the system reference (gates, agents, registries, rules).',
    tabs: [
      { id: 'install', tab: 'INSTALL — install & update' },
      { id: 'how-to', tab: 'HOW-TO — step by step' },
      { id: 'readme', tab: 'README — the system' },
    ],
    installedNote: ' — installs verbatim in every repo',
    tocHeading: 'In this document',
    langNote: null as string | null,
  },
  usage: {
    back: 'back to the documentation',
    kicker: 'how to use it — from picking an install to closing the first spec',
    h1a: 'How this is used,',
    h1b: ' step by step.',
    body: 'Five tabs covering the whole path: which of the three install modes is yours and what the wizard asks, how to move the kit up a version without losing anything of yours, what the SPEC GATE demands under each profile, when the FIX GATE is the right way out, and how a spec is built end to end by talking to the sdd-steward.',
    tocHeading: 'In this tab',
  },
} as const;
