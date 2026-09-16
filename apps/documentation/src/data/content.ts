export { USAGE_TABS } from './usage';
export type { UsageTab, UsageBlock } from './usage';
export type TreeNode = {
  name: string;
  note?: string;
  accent?: boolean;
  children?: TreeNode[];
};

export type TerminalLine = {
  kind: 'cmd' | 'prompt' | 'answer' | 'out' | 'ok';
  text: string;
};

export const TERMINAL_SCRIPT: TerminalLine[] = [
  { kind: 'cmd', text: 'npx @e-burgos/sdd-harness init' },
  { kind: 'prompt', text: 'Project name:' },
  { kind: 'answer', text: 'flexi-market' },
  { kind: 'prompt', text: 'What do you want to generate?' },
  { kind: 'answer', text: 'Nx monorepo — apps/ + libs/ + tools/' },
  { kind: 'prompt', text: 'Which apps do you want to create?' },
  { kind: 'answer', text: 'React SPA · Spring Boot 3' },
  { kind: 'prompt', text: 'Which Docker services do you need?' },
  { kind: 'answer', text: 'PostgreSQL' },
  { kind: 'prompt', text: 'Proceed with this configuration?' },
  { kind: 'answer', text: 'Yes' },
  { kind: 'out', text: '→ Creating directory structure...' },
  { kind: 'out', text: '→ Generating Nx configuration files...' },
  { kind: 'out', text: '→ Generating Docker Compose...' },
  { kind: 'out', text: '→ Configuring SDD (Spec-Driven Development)...' },
  { kind: 'out', text: '→ Generating app: portal (react)...' },
  { kind: 'out', text: '→ Generating app: orders-api (springboot)...' },
  { kind: 'out', text: '→ Validating SDD registries (sdd:validate)...' },
  { kind: 'ok', text: '✓ sdd:validate OK — 8 files valid, cross-checks passed' },
  { kind: 'out', text: '→ Initializing git repository...' },
  { kind: 'ok', text: '✓ Workspace "flexi-market" created successfully.' },
];

export type Mode = {
  id: string;
  label: string;
  command: string;
  claim: string;
  detail: string;
  tree: TreeNode[];
  example: { title: string; lines: string[] };
};

const SDD_TREE: TreeNode = {
  name: 'sdd/',
  accent: true,
  note: 'sistema SDD completo',
  children: [
    { name: 'global.json', note: 'única fuente del nombre y estado de módulos' },
    { name: 'agents/', note: '7 agentes del ciclo + sdd-steward' },
    { name: 'skills/', note: '19 skills' },
    { name: 'prompts/', note: 'gates como slash commands' },
    { name: 'schemas/', note: 'JSON Schema estricto — additionalProperties: false' },
    { name: 'scripts/', note: 'spec-gate.mjs (SPEC GATE) · validate · rebuild · setup' },
    { name: 'docs/', note: 'visor sin dependencias' },
    { name: 'memory/', note: 'lessons + journal — MEMORIA GATE' },
    { name: 'templates/', note: 'blueprints de scaffolding' },
    { name: 'dual-harness/', note: 'capa 1: AGENTS.md + CLAUDE.md + GEMINI.md (~22 KB) + copilot-instructions.md' },
    { name: 'dual-harness/rules/', note: 'capa 2: gates + telemetría canónicos' },
    { name: 'specs/ · context/ · fixes/', note: 'specs, contexto por subproyecto, fixes' },
    { name: 'specs/[spec]/cycles/cycle-XX/', note: 'brief · functional · planner · architect · plan.md (flow lite) · cycle.json · tasks.json · artifacts/' },
    { name: 'api.json · components.json · schema.json', note: 'registros de arquitectura: endpoints, componentes, tablas' },
    { name: 'tasks.json · fixes.json · catalog.json', note: 'índices agregados — los lee el visor' },
    { name: 'kit.json · pricing.json', note: 'hashes para update sdd · tarifas de Costos' },
    { name: 'tools.json', note: 'interruptor de rtk' },
    { name: 'documentation/', note: 'INSTALL · HOW-TO · README — en es/ y en/' },
    { name: 'README.md', note: 'índice bilingüe de la documentación' },
  ],
};

export const MODES: Mode[] = [
  {
    id: 'nx',
    label: 'Nx monorepo',
    command: 'harness init',
    claim: 'Workspace completo para equipos: múltiples apps, libs compartidas.',
    detail:
      'Config raíz derivada del kit portable (Nx 23 + pnpm 10, globs apps/* libs/* tools/*). Las apps react y springboot salen de los blueprints del kit; symlinks del arnés multi-proveedor y commit inicial incluidos. Este árbol es el ejemplo real flexi-market/ del repo de examples.',
    tree: [
      {
        name: 'flexi-market/',
        children: [
          {
            name: 'apps/',
            children: [
              { name: 'portal/', note: 'react · blueprint react-app' },
              { name: 'orders-api/', note: 'springboot · Maven hexagonal' },
            ],
          },
          { name: 'libs/', note: 'shared-types · blueprint ts-lib' },
          { name: 'tools/' },
          SDD_TREE,
          {
            name: '.claude/ · .github/ · .agents/ · .agent/ · .gemini/',
            note: 'arnés symlinkeado — Claude Code, Copilot y Gemini',
          },
          { name: 'AGENTS.md → sdd/dual-harness/', note: 'symlink' },
          { name: 'CLAUDE.md → sdd/dual-harness/', note: 'symlink' },
          { name: 'GEMINI.md → sdd/dual-harness/', note: 'symlink' },
          { name: '.nxignore', note: 'blueprints fuera del graph' },
          { name: 'nx.json · pnpm-workspace.yaml · tsconfig.base.json' },
          { name: 'eslint.config.mjs · docker-compose.yml · .env.example' },
        ],
      },
    ],
    example: {
      title: 'Un día de trabajo en este modo',
      lines: [
        '$ harness add app nestjs --name payments-api',
        '$ harness add spec payments --author jdoe',
        '# desde tu agente (Claude Code / Copilot / Gemini):',
        '/start-sdd-cycle.prompt payments',
        '→ orquestador → funcional → planner+arquitecto → implementadores → reviewer',
      ],
    },
  },
  {
    id: 'standalone',
    label: 'Standalone',
    command: 'harness init --standalone',
    claim: 'UNA app con el código en la raíz del repo. Sin Nx, sin capas de más.',
    detail:
      'El repo se registra en los registros SDD como app lógica única apps/<nombre> — los schemas quedan intactos y todos los gates funcionan igual. Siete tipos: react, springboot, nestjs, nextjs, fastify, hono, python. Este árbol es el ejemplo real pulse-api/ del repo de examples.',
    tree: [
      {
        name: 'pulse-api/',
        children: [
          { name: 'src/', note: 'el código vive en la raíz — fastify + tsx' },
          { name: 'package.json', note: 'scripts sdd:* + dev/build/test' },
          { name: 'tsconfig.json · docker-compose.yml · .env.example' },
          SDD_TREE,
          {
            name: '.claude/ · .github/ · .agents/ · .agent/ · .gemini/',
            note: 'arnés symlinkeado — Claude Code, Copilot y Gemini',
          },
          { name: 'AGENTS.md → sdd/dual-harness/', note: 'symlink' },
          { name: 'GEMINI.md → sdd/dual-harness/', note: 'symlink' },
        ],
      },
    ],
    example: {
      title: 'Un día de trabajo en este modo',
      lines: [
        '$ npx @e-burgos/sdd-harness init --standalone',
        '? tipo de app → fastify (el código vive en la raíz)',
        '$ harness add spec catalogo --author jdoe',
        '# mismo ciclo SDD, misma trazabilidad — sin capas de más',
      ],
    },
  },
  {
    id: 'harness',
    label: 'SDD harness',
    command: 'harness configure sdd',
    claim: 'Solo la metodología, sobre un proyecto que ya existe. Sin tocar tu código.',
    detail:
      'Detecta la forma del repo (Nx vs standalone), mergea los scripts sdd:* en tu package.json sin pisar nada, y absorbe tus AGENTS.md/CLAUDE.md/GEMINI.md previos dentro de sdd/dual-harness/ antes de crear los symlinks, y conserva tus propios agentes, skills y commands en .claude/, .github/ y .agents/ (el kit se enlaza al lado; cada colisión queda como *.new): ninguna instrucción se pierde. Este árbol es el ejemplo real legacy-shop/ del repo de examples, generado desde su semilla versionada.',
    tree: [
      {
        name: 'legacy-shop/',
        children: [
          { name: 'src/', note: 'tu código, intacto — byte a byte' },
          {
            name: 'package.json',
            note: 'scripts propios + sdd:* mergeados, versión conservada',
          },
          SDD_TREE,
          {
            name: 'sdd/dual-harness/AGENTS.md',
            note: 'incluye tus reglas previas, absorbidas',
          },
          {
            name: '.claude/ · .github/ · .agents/ · .agent/ · .gemini/',
            note: 'arnés symlinkeado — Claude Code, Copilot y Gemini',
          },
        ],
      },
    ],
    example: {
      title: 'Un día de trabajo en este modo',
      lines: [
        '$ cd mi-repo-legacy',
        '$ npx @e-burgos/sdd-harness configure sdd',
        '→ AGENTS.md previo absorbido — ninguna regla se pierde',
        '$ harness idea "migrar el módulo de reportes a async"',
        '# el agente analiza gaps contra tu stack real y arma el plan',
      ],
    },
  },
];

export type HermesPhase = {
  id: string;
  label: string;
  title: string;
  body: string;
  code: string[];
};

export const HERMES_PHASES: HermesPhase[] = [
  {
    id: 'idea',
    label: '01 · Idea',
    title: 'Registrás la idea — en lenguaje natural',
    body: 'Un comando deja la idea versionada junto al protocolo que el agente va a seguir, con los checkpoints humanos marcados. En un repo vacío también deja el stub del stack y su JSON Schema.',
    code: [
      '$ npx @e-burgos/sdd-harness idea "una app de turnos',
      '    para peluquerías con recordatorios"',
      '',
      '✓ harness.idea.md             # la idea + el protocolo',
      '✓ harness.config.json         # stub del stack',
      '✓ harness.config.schema.json  # validable sin la CLI',
    ],
  },
  {
    id: 'stack',
    label: '02 · Stack',
    title: 'El agente propone el stack — vos aprobás',
    body: 'La matriz de decisión de la skill sdd-hermes mapea necesidades → piezas (apps, libs, servicios Docker). Checkpoint humano obligatorio: nada se genera sin tu OK.',
    code: [
      '// harness.config.json — completado por el agente',
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
    title: 'Se genera solo — cero prompts',
    body: 'La vía no interactiva de init: config validada con zod, errores con path exacto, y el workspace completo con el sistema SDD instalado, validado y commiteado.',
    code: [
      '$ npx @e-burgos/sdd-harness init --config ./harness.config.json',
      '',
      '→ Generando workspace nx...',
      '→ Instalando sistema SDD (8 agentes, 19 skills)...',
      '✓ sdd:validate OK — registros verdes',
    ],
  },
  {
    id: 'specs',
    label: '04 · Specs',
    title: 'Una spec por módulo — el contrato',
    body: 'El agente redacta una spec por módulo core desde el descubrimiento. La spec es el contrato: la aprobás (o editás) antes de que el loop implemente. SPEC GATE: sin spec no hay código.',
    code: [
      '$ harness add spec auth --author eburgos',
      '$ harness add spec turnos --author eburgos',
      '',
      'sdd/specs/spec-eburgos-001-auth/',
      'sdd/specs/spec-eburgos-002-turnos/',
    ],
  },
  {
    id: 'loop',
    label: '05 · Loop',
    title: 'El loop de ciclos corre — y es retomable',
    body: 'Módulo por módulo, los 7 agentes hacen su fase con todos los gates activos. El estado vive en los registros, no en la sesión: cualquier sesión futura retoma exactamente donde quedó. Con perfil solo el loop corre ciclos lite: un solo actor abre, implementa y cierra cada módulo — mismos gates, mismos invariantes.',
    code: [
      'mientras queden módulos pendientes:',
      '  orquestador  → pnpm sdd:gate + cycle.json (SPEC GATE)',
      '  5 agentes    → diseño, tasks, código, review',
      '  cierre       → contexto + memoria + telemetría',
      '',
      '# ¿se cortó la sesión? en la próxima:',
      '$ sdd/prompts/hermes-resume.prompt.md',
    ],
  },
];

export type Command = {
  name: string;
  usage: string;
  summary: string;
  points: string[];
};

export const COMMANDS: Command[] = [
  {
    name: 'init',
    usage: 'harness init [--name] [--mode nx|standalone] [--standalone] [--config <file>] [--profile team|solo] [--here] [--dir <path>] [--skip-verify] [-y]',
    summary: 'Genera un repo desde cero: monorepo Nx o app standalone.',
    points: [
      'Prompts guiados: nombre, descripción, modo, apps, libs, servicios Docker.',
      '--config <archivo .json|.mjs|.js>: vía 100% no interactiva para agentes AI y CI — config validada con zod (mode, project, apps, libs, services, sdd —incluido sdd.profile—, npm) y cero prompts.',
      '--profile team|solo: perfil de trabajo, que baja a sdd/global.json → profile. team (default) abre los ciclos en flow full; solo los abre en flow lite (un solo actor, plan.md en vez de los cuatro documentos). Con --config manda sdd.profile. Si no se pasa, la clave no se escribe y el repo queda en team.',
      '--here (o --dir .) genera en el directorio actual en vez de ./<name>; también se infiere si el --config vive en el cwd o si basename(cwd) == nombre del proyecto — ya no anida <name>/<name>/ cuando el dev ya hizo git init y harness idea en la carpeta.',
      'Si el cwd ya es un repo git no corre git init: commitea en la rama actual y mergea un .gitignore previo en vez de pisarlo.',
      'Cierra ejecutando el gate de FASE 3 (sdd:validate + nx run-many -t lint test build, o los scripts lint/test/build en standalone): si algo da rojo, init falla (exit 1) y no hace el commit inicial. --skip-verify lo omite.',
      'Genera README.md raíz (apps con tipo, puerto y comando) si no existe, y .env.example siempre — con <APP>_PORT por app además de los servicios.',
      'SDD siempre incluido — no es opcional.',
    ],
  },
  {
    name: 'idea',
    usage: 'harness idea ["<idea en lenguaje natural>"] [--author <gh-user>] [--show] [--force]',
    summary: 'Entrada del punta-a-punta hermes: de una idea a producto.',
    points: [
      'Persiste harness.idea.md: la idea verbatim + un protocolo autosuficiente para FASE 1–3 (matriz necesidad→pieza, standalone vs nx, el comando init con la nota de generar en el cwd) — porque en un repo vacío la skill sdd-hermes todavía no existe. Ahora incluye también las secciones ## Evidencia del descubrimiento y ## Decisiones del dev, que el agente completa en FASE 1 y las specs citan.',
      '--author <gh-user>: queda en sdd.author del stub de config y en la cabecera del idea file — firma las specs (add spec / sdd.modules).',
      '--show: imprime la idea registrada, la tabla de evidencia y las decisiones — para retomar el trabajo con hermes-resume sin releer todo el archivo.',
      'En repo vacío deja también el stub harness.config.json (con apps[0].port y sdd: { author?, modules: [] }) y su JSON Schema, listos para init --config.',
      'En un workspace SDD existente, el protocolo cambia a análisis de gaps (harness add app|service|spec).',
      'La inteligencia vive en la skill sdd-hermes del kit — el comando materializa la entrada determinista.',
    ],
  },
  {
    name: 'config schema',
    usage: 'harness config schema [--out <archivo>]',
    summary: 'Imprime el JSON Schema del contrato de init --config.',
    points: [
      'Derivado del mismo schema zod con el que valida la CLI: agentes y editores validan configs sin ejecutarla.',
      'apps[].port ahora se respeta: baja al default del código del app (env var por app, ej. catalog-api → CATALOG_API_PORT), al .env.example y al README.',
      'sdd.author (usuario de GitHub) y sdd.modules (slugs o objetos { name, title?, description?, app?, apps?, depends_on? }): cada módulo se siembra como spec draft + entrada en pending_modules al correr init.',
      'npm.scopes: [{ scope, registry }] genera las líneas @org:registry=… del .npmrc — solo la URL; la credencial va en el ~/.npmrc local y NODE_AUTH_TOKEN en CI.',
    ],
  },
  {
    name: 'add app',
    usage: 'harness add app [tipo] --name <nombre>',
    summary: 'Agrega una app a un workspace existente.',
    points: [
      'react y springboot desde los blueprints de sdd/templates/ del propio repo.',
      'Registra la app en sdd/global.json y crea su contexto de subproyecto.',
    ],
  },
  {
    name: 'add tool',
    usage: 'harness add tool [nombre] --type <qué es>',
    summary: 'Registra una tool como subproyecto SDD. No genera código.',
    points: [
      'Escribe la entrada en sdd/global.json → monorepo.tools (la clave se crea recién con la primera tool: es opcional en el schema) y crea sdd/context/tools/<nombre>/ con constitution.md, context_prompt.md y updates/.',
      'Una tool es lo que el equipo escribe en tools/<nombre>/ — scripts, CLIs internas, generadores. El comando aporta lo que faltaba para que exista como subproyecto: su registro y su contexto.',
      'Con eso el visor la lista en Contexto y en el Dashboard, y el SPEC GATE B puede exigir su constitution.md cuando un ciclo la toca.',
    ],
  },
  {
    name: 'add spec',
    usage: 'harness add spec [slug] --author <gh-user> --title <t> --app apps/<n> [--apps <a,b>] [--depends-on <id|slug>] [--description <t>]',
    summary: 'Crea una spec con la convención multi-developer v2.0.',
    points: [
      'Estructura spec-[autor]-[NNN]-[slug]/ con cycles/ y fixes/. Contador NNN per-autor y registro en sdd/specs/index.json con status: draft (draft | in-progress | completed | cancelled) — el orquestador la pasa a in-progress al abrir cycle-01.',
      '--apps apps/a,libs/b (repetible o por comas): todos los subproyectos que toca el módulo, además del --app principal.',
      '--depends-on <spec-id|slug> (repetible/comas): se resuelve contra sdd/specs/index.json.',
      'Registra el módulo en pending_modules de sdd/global.json automáticamente ({ module, spec, apps, cycles_completed: 0, description }) — antes había que escribirlo a mano.',
      'Valida los registros al terminar (sdd:validate).',
    ],
  },
  {
    name: 'add skill',
    usage: 'harness add skill [nombre] --description <texto>',
    summary: 'Crea una skill nueva en sdd/skills/.',
    points: [
      'Archivo SKILL.md en mayúscula — estándar Agent Skills, requerido por Claude Code.',
      'Con frontmatter name/description listo para los tres consumidores: Claude Code, Copilot y Gemini CLI.',
    ],
  },
  {
    name: 'add service',
    usage: 'harness add service [tipo]',
    summary: 'Suma un servicio al docker-compose.yml.',
    points: ['postgres · redis · rabbitmq · minio, con healthchecks.'],
  },
  {
    name: 'configure sdd',
    usage: 'harness configure sdd --name <n> --description <d> [--profile team|solo] [--apps name=path,...]',
    summary: 'Instala (o resetea) el sistema SDD en un proyecto existente.',
    points: [
      'Detección de forma: monorepo Nx o repo standalone. En un monorepo registra las apps de apps/ y todo project.json de tipo application fuera de apps/ (src/<name>...); --apps name=path,... las declara a mano. Sin ninguna app, falla en vez de instalar un kit vacío.',
      'Merge automático de package.json + absorción del arnés previo.',
      'Sin prompts con --name y --description: un agente puede correrlo.',
      '--profile team|solo: mismo perfil que en init — se escribe en sdd/global.json → profile solo si se pasa (ausente = team, ciclos full).',
    ],
  },
  {
    name: 'update sdd',
    usage: 'npx @e-burgos/sdd-harness@latest update sdd [-y]',
    summary: 'Actualiza el kit SDD instalado preservando todo lo tuyo.',
    points: [
      'Baseline de hashes en sdd/kit.json: lo no tocado se reemplaza, lo customizado se preserva (la versión nueva queda como .new).',
      'Tus datos (specs, ciclos, fixes, contextos, registros) jamás se tocan.',
      'Cierra con setup:agents, rebuild del catálogo y sdd:validate.',
    ],
  },
  {
    name: 'configure docker / mcp',
    usage: 'harness configure docker · harness configure mcp',
    summary: 'Regenera docker-compose o configura servidores MCP (.mcp.json).',
    points: ['Multi-select con lo ya configurado preseleccionado.'],
  },
  {
    name: 'configure memory',
    usage: 'harness configure memory',
    summary: 'Proveedores de memoria MCP opt-in sobre la base portable del kit.',
    points: [
      'La base (sdd/memory: lessons.md + journal) es archivos versionados, cero dependencias — esto agrega recuperación semántica opcional.',
      'basic-memory (Markdown local-first) o knowledge-graph oficial persistido en sdd/memory/ (viaja con git).',
      'Merge no destructivo de .mcp.json: no toca otros servidores configurados.',
    ],
  },
  {
    name: 'info',
    usage: 'harness info',
    summary: 'Radiografía del workspace: apps, servicios, estado SDD.',
    points: ['Lee sdd/global.json: módulos completados, en progreso, apps registradas.'],
  },
];

export type Agent = { name: string; role: string; writes: string };

export const AGENTS: Agent[] = [
  { name: 'orchestrator', role: 'Corre pnpm sdd:gate, decide el flow y abre el ciclo', writes: 'brief.yaml / plan.md · cycle.json' },
  { name: 'functional', role: 'Spec → historias de usuario', writes: 'functional.md' },
  { name: 'planner', role: 'Historias → tareas técnicas', writes: 'planner.md · tasks.json' },
  { name: 'architect', role: 'Valida diseño, define contratos', writes: 'architect.md · schema.json · api.json' },
  { name: 'implementor-back', role: 'Implementa el backend, task por task', writes: 'código + api.json' },
  { name: 'implementor-front', role: 'Implementa la UI contra los contratos', writes: 'código + components.json' },
  { name: 'reviewer', role: 'VALIDATION GATE + cierre del ciclo', writes: 'cycle.json · context/**' },
];

export type Gate = { name: string; rule: string; how: string };

export const GATES: Gate[] = [
  {
    name: 'SPEC GATE',
    rule: 'Ni una línea de código sin spec registrada, ciclo abierto, plan y tasks — en cualquier flow.',
    how: 'Dos momentos, y los dos se contestan con un comando en vez de leer archivos a mano: pnpm sdd:gate <spec-id|slug> es el GATE A, la apertura del ciclo que corre el orquestador (spec registrada en specs/index.json · módulo en pending_modules o in_progress_modules · ningún otro ciclo de esa spec in-progress · depends_on completed · spec ni completed ni cancelled), y pnpm sdd:gate <spec-id|slug> cycle-XX es el GATE B, el que corre quien va a escribir código (cycle.json in-progress · módulo en in_progress_modules · tasks.json con al menos una task · los documentos del flow de ESE ciclo · constitution.md de cada subproyecto de cycle.json.apps). Imprime una línea por condición con ✔/✘, cierra con APPROVED o BLOCKED y sale 0/1 (--json para agentes); en GATE A además dice cuál es el próximo ciclo y qué flow sugiere. Los invariantes no cambian nunca: spec registrada, módulo en global.json, cycle.json in-progress antes de la primera línea de código, tasks.json con tasks y ninguna task en done sin su usage. Lo que cambia es la forma — flow full (brief · functional · planner · architect), reduced (brief) o lite (plan.md, un solo actor) — y lo decide sdd/global.json → profile: team abre full, solo abre lite, y los prefijos [LITE] / [FULL] en el pedido le ganan al perfil.',
  },
  {
    name: 'FIX GATE',
    rule: 'Los bugs urgentes no esperan un ciclo completo — pero quedan registrados.',
    how: 'Prefijos [HOTFIX] [BUGFIX] [FIX] [IMPROVEMENT] activan un bypass liviano con trazabilidad en fixes.json. Con profile: solo el atajo es más corto todavía: sin cuestionario (el actor completa fixes.json desde el pedido mismo y pregunta solo lo que no puede deducir), documento mínimo (problema · solución · archivos) y elegibilidad reducida a "no crea contratos ni entidades nuevas" — registro, usage, fragmento de contexto y sdd:validate siguen igual.',
  },
  {
    name: 'CONTEXTO GATE',
    rule: 'Un ciclo no cierra con el contexto desactualizado.',
    how: 'Fragmentos aditivos por ciclo en context/**/updates/ — únicos por construcción, cero merge conflicts.',
  },
  {
    name: 'MEMORIA GATE',
    rule: 'Lo aprendido en un ciclo no se vuelve a pagar en el siguiente.',
    how: 'Lecciones destiladas en memory/lessons.md (cap 120 líneas, leído al iniciar sesión) + journal episódico append-only que el orquestador destila con ≥5 entradas.',
  },
  {
    name: 'TELEMETRÍA GATE',
    rule: 'Un ciclo no cierra sin declarar qué proveedor y qué modelo lo hicieron.',
    how: 'cycle.json → metrics.usage.by_agent[] — cada agente registra provider_model, effort, tokens_in/out, approx y source al cerrar su propia unidad; by_tier se deriva de by_agent, nunca se reconstruye. Fuente exacta agent-usage-notification (Claude Code: <usage><subagent_tokens>N</subagent_tokens>… al terminar un subagente); sin contador por sesión (Copilot, Antigravity) va como estimación declarada con approx: true — el visor la muestra como estimado, nunca la esconde. Desde 2026-09-02 el validador FALLA (antes: warning) si un ciclo o fix cierra sin proveedor/modelo + tokens.',
  },
];

export const APP_CATALOG = [
  { type: 'react', stack: 'React 19 + Vite + Tailwind', origin: 'blueprint react-app' },
  { type: 'springboot', stack: 'Spring Boot 3.5 + Java 21, hexagonal', origin: 'blueprint java-api (Maven)' },
  { type: 'nestjs', stack: 'NestJS 11', origin: 'generador propio' },
  { type: 'nextjs', stack: 'Next.js 15 (App Router)', origin: 'generador propio' },
  { type: 'fastify', stack: 'Fastify 5', origin: 'generador propio' },
  { type: 'hono', stack: 'Hono 4 + node-server', origin: 'generador propio' },
  { type: 'python', stack: 'Python 3.11 + pyproject', origin: 'generador propio' },
];

export const LIB_CATALOG = ['shared-types', 'shared-utils', 'ui-kit', 'api-client', 'config'];

export const SERVICE_CATALOG = ['postgres', 'redis', 'rabbitmq', 'minio'];

export const SDD_SCRIPTS = [
  { cmd: 'pnpm sdd:validate', what: 'Valida TODOS los registros contra sus schemas + reglas cruzadas + regla de portabilidad' },
  { cmd: 'pnpm sdd:gate', what: 'Contesta el SPEC GATE: <spec-id|slug> para abrir un ciclo (GATE A) y <spec-id|slug> cycle-XX para habilitar el código (GATE B). Una línea por condición, APPROVED/BLOCKED, exit 0/1 y --json para agentes' },
  { cmd: 'pnpm sdd:docs', what: 'Visor del sistema SDD — vanilla JS, cero dependencias, funciona offline' },
  { cmd: 'pnpm setup:agents', what: 'Symlinks del arnés multi-proveedor: .claude/, .github/, .agents/, .agent/, .gemini/, AGENTS.md, CLAUDE.md, GEMINI.md' },
  { cmd: 'pnpm sdd:rebuild-tasks-index', what: 'Regenera el índice de tasks desde los tasks.json per-cycle' },
  { cmd: 'pnpm sdd:rebuild-catalog', what: 'Regenera el manifest que consume el visor' },
];

export type Harness = {
  name: string;
  tagline: string;
  reads: string[];
  models: string;
};

export const HARNESSES: Harness[] = [
  {
    name: 'Claude Code',
    tagline: 'enforcement programático',
    reads: [
      'CLAUDE.md → sdd/dual-harness/CLAUDE.md',
      '.claude/agents · skills · prompts · commands (slash commands SDD)',
    ],
    models:
      'Pasa model y effort explícitos en cada subagente y workflow, según la tabla canónica de tiers del arnés. El fan-out de lectores va en económico; la síntesis y el review en alto.',
  },
  {
    name: 'GitHub Copilot',
    tagline: 'pinning por frontmatter',
    reads: [
      'AGENTS.md → sdd/dual-harness/AGENTS.md',
      '.github/agents · skills · prompts (custom agents + prompt files)',
      '.github/copilot-instructions.md — archivo real (no symlink: los lectores server-side de GitHub no los siguen), sembrado por pnpm setup:agents desde sdd/dual-harness/copilot-instructions.md solo si no existe; después es del proyecto y nunca se pisa',
    ],
    models:
      'Los 8 agentes SDD llevan model: pinneado por rol en el frontmatter (alias Claude opus/sonnet); el equipo lo mapea una vez al modelo del mismo tier de su org. En Copilot CLI: --model y --reasoning-effort.',
  },
  {
    name: 'Antigravity',
    tagline: 'dropdown del usuario',
    reads: [
      'GEMINI.md → sdd/dual-harness/GEMINI.md',
      '.agents/rules — los gates SDD como rules siempre activas',
      '.agents/skills · .agent/workflows → /start-sdd-cycle, /hermes-resume…',
    ],
    models:
      'El agente no puede cambiar de modelo por su cuenta: antes de ejecutar compara el modelo del dropdown con el tier requerido y, si no coinciden, pide el cambio de modelo o thinking level. Nunca ejecuta en silencio con el tier equivocado.',
  },
  {
    name: 'Gemini CLI',
    tagline: 'modelo por sesión + /stats',
    reads: [
      'GEMINI.md + AGENTS.md (.gemini/settings.json → context.fileName)',
      '.agents/skills (estándar SKILL.md compartido con Antigravity)',
      '.gemini/commands/*.toml — los prompts SDD como slash commands',
    ],
    models:
      'Modelo por sesión o flag según el tier; el fan-out va en subagentes económicos y la síntesis en Pro. /stats da los tokens reales de la sesión — la fuente honesta de la telemetría (es un comando del cliente: se lo pide el agente al dev).',
  },
];

export const PORTABILITY_POINTS = [
  {
    title: 'global.json es la única fuente del nombre',
    body: 'Ningún otro archivo del kit hardcodea el nombre o la descripción del proyecto. sdd:validate falla si se filtran. Por eso el kit se copia verbatim entre repos, sin renderizar templates.',
  },
  {
    title: 'Schemas estrictos, registros confiables',
    body: 'Cada JSON de sdd/ valida contra un schema con additionalProperties: false. Un commit que deja sdd:validate en rojo es un commit inválido.',
  },
  {
    title: 'Un solo arnés, tres asistentes',
    body: 'Claude Code, GitHub Copilot y Gemini (Antigravity + Gemini CLI) leen los mismos agentes, skills y prompts vía symlinks. Editás en sdd/, lo ven los tres.',
  },
];

export type ViewerShot = {
  id: string;
  tab: string;
  caption: string;
};

export const VIEWER_SHOTS: ViewerShot[] = [
  {
    id: 'costs',
    tab: 'Costos ★',
    caption:
      'La vista estrella, ahora en cuatro pestañas con gráficos: General (agéntico vs tradicional, costo por agente, tokens por proveedor y columna Origen que distingue lo medido de la estimación declarada), Specs, Fixes y RTK (cuánto texto de comandos ahorró rtk). Se actualiza sola mientras el loop trabaja.',
  },
  {
    id: 'dashboard',
    tab: 'Dashboard',
    caption:
      'Estado del proyecto en una pantalla: specs, ciclos, fixes, apps registradas y el bloque monorepo de global.json — con indicador LOCAL · LIVE y sincronización en vivo.',
  },
  {
    id: 'agents',
    tab: 'Agentes',
    caption:
      'Los 8 agentes SDD (los 7 del ciclo + sdd-steward, el conserje del kit) con sus definiciones completas renderizadas — mismo .agent.md, con model: pineado, que leen Claude Code, Copilot y Gemini, navegable.',
  },
  {
    id: 'skills',
    tab: 'Skills',
    caption:
      'El catálogo completo de skills del kit, leído del filesystem vía catalog.json — orquestación, workspace, generadores de código.',
  },
  {
    id: 'schemas',
    tab: 'Schemas JSON',
    caption:
      'Los JSON Schema estrictos de cada registro, explorables campo por campo. Lo que sdd:validate exige, documentado solo.',
  },
  {
    id: 'help',
    tab: 'Metodología',
    caption:
      'La documentación completa del sistema SDD (README, HOW-TO, gates) renderizada dentro del propio visor.',
  },
];

export const VIEWER_SECTIONS = [
  { section: 'Visión general', views: ['Dashboard', 'Planificación', 'Costos'] },
  { section: 'SDD', views: ['Specs', 'Ciclos', 'Tareas', 'Fixes', 'Contexto', 'Memoria'] },
  { section: 'Herramientas SDD', views: ['Agentes', 'Skills', 'Prompts'] },
  { section: 'Arquitectura', views: ['Schema', 'API', 'Componentes', 'Schemas JSON'] },
  { section: 'Ayuda', views: ['Documentación SDD'] },
];

export const VIEWER_PRINCIPLES = [
  {
    title: 'Cero dependencias, cero build',
    body: 'JS vanilla + un server con solo módulos node:*. No hay npm install del visor, no hay paso de compilación, no hay framework que se desactualice. Abrís el puerto y está.',
  },
  {
    title: 'Lee los registros en vivo — y se actualiza solo',
    body: 'No genera HTML estático: consume global.json, specs/index.json, tasks.json y catalog.json directamente del filesystem. En local pollea un fingerprint POR ÁREA cada 4s: solo re-renderiza tu vista si cambió algo de lo que depende, y preserva secciones expandidas, búsquedas y scroll.',
  },
  {
    title: 'Dashboard de Costos',
    body: 'Cuatro pestañas, todas con gráficos (SVG inline, sin librerías) y tablas scrolleables de alto fijo: General (KPIs, tradicional vs agéntico por spec, costo por agente, tokens por proveedor, origen de la telemetría y metodología), Specs (costo por spec, tokens por ciclo, detalle de ciclos), Fixes (costo por tipo, severidad, estado, tokens y detalle) y RTK (comandos comprimidos, tokens generados vs leídos, ahorro con su % promedio y equivalente aproximado en USD). El costo agéntico sale de tarifas editables en sdd/pricing.json y la columna Origen marca cada proveedor como medido o estimado, así una aproximación declarada nunca pasa por medición.',
  },
  {
    title: 'Viaja con el kit',
    body: 'sdd/docs/ es parte de la carpeta sdd/ — copiar el kit a otro repo lleva la metodología Y su visor. Fuentes vendorizadas: funciona offline, sin CDN.',
  },
  {
    title: 'Server restringido por diseño',
    body: 'serve.mjs solo expone /sdd/** en 127.0.0.1 — no puede servir código de tu app ni escuchar fuera de localhost.',
  },
];

export const UI = {
  nav: {
    groups: [
      {
        label: 'Producto',
        items: [
          { id: 'modos', label: 'Los 3 modos' },
          { id: 'catalogo', label: 'Catálogo' },
          { id: 'empezar', label: 'Empezar' },
        ],
      },
      {
        label: 'Agentes',
        items: [
          { id: 'hermes', label: 'Idea → producto' },
          { id: 'steward', label: 'Día a día con el steward' },
          { id: 'metodologia', label: 'Metodología SDD' },
          { id: 'multi-harness', label: 'Multi-harness' },
        ],
      },
      {
        label: 'El kit',
        items: [
          { id: 'kit', label: 'El kit portable' },
          { id: 'comandos', label: 'Comandos' },
          { id: 'en-vivo', label: 'Costos en vivo' },
        ],
      },
    ],
    guiaLabel: 'guía sdd',
    sddDocsMenu: 'sdd:docs — el visor',
    guiaMenu: 'guía sdd — el manual completo',
    usageLabel: 'cómo usarlo',
    usageMenu: 'cómo usarlo — la guía práctica',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
  },
  hero: {
    kicker: 'Spec-Driven Development CLI',
    title1: 'Repos listos para agentes.',
    title2: ' Specs antes que código.',
    body: ' genera repos con la metodología SDD integrada: 8 agentes especializados, gates que impiden codear sin diseño, registros validados por schema y un arnés multi-proveedor que Claude Code, GitHub Copilot y Gemini leen por igual.',
    cta: 'Ver los 3 modos',
    chips: ['8 agentes SDD', '19 skills', '5 gates', 'SPEC GATE como comando', 'flow lite · perfil solo', 'schemas estrictos', 'costos en vivo', 'memoria portable', 'Nx · standalone · existente'],
  },
  modes: {
    kicker: '01 — los tres modos',
    title: 'Un producto, tres formas de entrar',
    lead: 'Monorepo nuevo, app suelta, o un proyecto que ya existe: el sistema SDD que se instala es exactamente el mismo.',
  },
  hermes: {
    kicker: '02 — hermes, el punta a punta',
    title: 'De una idea en una frase a un producto con specs',
    lead: 'Le pasás una idea en lenguaje natural y el sistema configura el stack, siembra el backlog y conduce el loop de ciclos — con checkpoints humanos donde importa y sin bypassear un solo gate.',
    loopNotePre: 'Y cada ciclo deja lecciones en ',
    loopNotePost: ': el sistema aprende del proyecto y no vuelve a pagar dos veces el mismo descubrimiento.',
  },
  live: {
    kicker: '03 — la feature estrella',
    title: 'Un tablero que trabaja mientras los agentes trabajan',
    lead: 'Cada ciclo registra tokens y tiempos. El visor los convierte en una comparativa de costos contra la estimación tradicional — y en local se actualiza solo, mientras el loop corre. Dale play:',
    features: [
      { t: 'Telemetría honesta', d: 'Al cerrar cada ciclo se registran tokens por proveedor/modelo y minutos en cycle.json → metrics.usage — es obligatorio, y va marcado approx: true cuando el arnés no expone contador, así la estimación se declara en vez de esconderse. Cada agente suma su propia unidad en by_agent al cerrarla; by_tier se deriva de ahí. La fuente agent-usage-notification (Claude Code) es exacta, no estimada. El costo agéntico sale de tarifas editables en sdd/pricing.json; la estimación tradicional, de las horas que ya estiman tus tasks.' },
      { t: 'rtk activo por defecto', d: 'Desde el kit v0.12.0 la salida de los comandos de shell (git, pnpm, vitest, tsc, eslint…) llega comprimida al agente — rtk reporta 60–90% menos texto — sin tocar la lectura de archivos y sin que el dev haga nada: la instalación y el update dejan el hook puesto. El interruptor vive en sdd/tools.json (pnpm sdd:rtk -- --disable), es best effort —si el binario falta, el comando corre igual— y el ahorro se ve en la pestaña RTK de Costos.' },
      { t: 'Menos contexto por sesión (v0.13.0)', d: 'El arnés raíz que se carga siempre pasó de ~32 KB a ~22 KB: la definición completa de los gates y del contrato de telemetría se mudó a sdd/dual-harness/rules/, que se lee cuando hace falta. En la misma línea, el SPEC GATE se contesta con pnpm sdd:gate en vez de leer diez archivos a mano, y el flow lite (perfil solo) resuelve el ciclo con un solo actor y un plan.md en lugar de cuatro documentos y cinco agentes — menos tokens por ciclo, exactamente los mismos invariantes.' },
      { t: 'Reactividad quirúrgica', d: 'El visor pollea un fingerprint POR ÁREA de los registros cada 4 segundos. Solo re-renderiza tu vista si cambió un área de la que depende: cerrar un ciclo actualiza Costos y Ciclos, pero no te toca la vista de Agentes.' },
      { t: 'Tu UI queda intacta', d: 'Secciones expandidas, búsquedas escritas y posición de scroll se preservan en cada actualización. Y si tenés un documento abierto o la pestaña oculta, el refresh espera. En hosting estático, el botón Actualizar de siempre.' },
    ],
    cta: 'Ver el visor completo, con capturas reales',
    demo: {
      live: 'local · live',
      tagline: '— el visor mientras el loop trabaja',
      replay: 'replay',
      pause: 'Pausar simulación',
      resume: 'Reanudar simulación',
      kpiTasks: 'tasks done',
      kpiTokens: 'tokens',
      kpiCost: 'costo agéntico',
      kpiSaving: 'ahorro',
      legendTraditional: 'tradicional',
      legendAgentic: 'agéntico',
      activity: 'actividad del loop',
      steps: [
        { actor: 'sdd-orchestrator', feed: 'SPEC GATE OK · abre cycle-01 (auth) · brief + cycle.json' },
        { actor: 'sdd-implementor-back', feed: 'TASK-001 done · modelo de usuario · 352k tokens (claude/sonnet)' },
        { actor: 'sdd-implementor-back', feed: 'TASK-002 done · endpoints login/refresh · 608k tokens (claude/sonnet)' },
        { actor: 'sdd-architect', feed: 'TASK-003 done · revisión y hardening · ~171k tokens estimados (copilot/claude-sonnet · approx)' },
        { actor: 'sdd-reviewer', feed: 'cierra cycle-01 ✓ · CONTEXTO + MEMORIA + TELEMETRÍA GATE · lección → journal' },
      ],
      footnote: 'tradicional = 20 h estimadas × US$ 50/h · agéntico = tokens × tarifa por proveedor/modelo (sdd/pricing.json). TASK-003 corrió en Copilot, que no expone contador por sesión: va como estimación declarada (approx: true) y el visor la muestra como estimado — el ciclo mezcla un proveedor medido con uno estimado sin perder honestidad. La actividad del loop vive en el visor: vista Ciclos → abrí un ciclo → «Actividad del ciclo», reconstruida desde cycle.json + tasks.json.',
      donePre: 'Ciclo cerrado: el dashboard lo reflejó ',
      doneEm: 'solo',
      doneMid: ' — sin recargar, sin tocar nada, y sin perder lo que tenías expandido. Ahorro proyectado del ciclo: ',
      donePost: '.',
    },
  },
  commands: {
    kicker: '04 — referencia',
    title: 'Comandos',
    lead: 'Todo interactivo con prompts guiados; todo automatizable con flags y -y.',
  },
  methodology: {
    kicker: '05 — la metodología',
    title: 'Siete agentes, cinco gates, cero improvisación',
    lead: 'Cada feature atraviesa un ciclo de diseño antes de tocar código. Los agentes escriben artefactos verificables; los gates los exigen. En el flow lite (perfil solo) los siete roles los cubre un solo actor: abre el ciclo, escribe plan.md, implementa task por task y cierra como reviewer — sin fan-out de subagentes y con los mismos gates.',
    footnote1: 'specs por autor: spec-jdoe-001-user-onboarding / cycles/cycle-01/',
    footnote2: 'artefactos por ciclo — full: brief · functional · planner · architect · tasks · cycle / lite: plan · tasks · cycle',
  },
  multiHarness: {
    kicker: '06 — el arnés',
    title: 'De dual-harness a multi-harness',
    lead: 'Un solo sistema de agentes, skills, prompts y reglas vive en sdd/ — y cuatro arneses lo leen por igual vía symlinks. Editás una vez; lo ven todos. Cada arnés tiene además su propio mecanismo para cumplir la regla ⚙️ de modelos.',
    readsLabel: 'Qué lee',
    modelsLabel: 'Regla de modelos (⚙️)',
    dualNote: {
      title: 'La salvedad del nombre: ya no es «dual»',
      body: 'El arnés nació dual — Claude Code y GitHub Copilot — y así se llamó su carpeta. Desde v0.7.0 es multi-harness: se sumó Gemini con dos superficies (Antigravity IDE y Gemini CLI). El directorio sdd/dual-harness/ conserva el nombre por compatibilidad (los hashes de kit.json y update sdd dependen de esa ruta), pero adentro viven las tres ediciones del mismo contrato — AGENTS.md, CLAUDE.md y GEMINI.md — más las rules de Antigravity en rules/ y copilot-instructions.md. Desde v0.13.0 el arnés está en dos capas: la capa 1 son los archivos raíz, que se cargan siempre y quedaron en ~22 KB (antes ~32) con las reglas y los gates en forma corta y punteros; la capa 2 es sdd/dual-harness/rules/, que se lee cuando hace falta y guarda las definiciones canónicas — sdd-gates.md (el SPEC GATE completo, en sus dos momentos, con los flows y el perfil) y sdd-model-budget.md (el contrato de telemetría: quién registra qué y cuándo, la tabla de fuentes por arnés y las reglas del validador). Si un gate cambia, cambia en un solo archivo.',
    },
    telemetryNote:
      'Los cuatro registran la misma telemetría y es obligatoria: cycle.json → metrics.usage.by_agent[] (uno por agente que cerró una unidad, con proveedor/modelo — claude/opus, gemini/pro, copilot/claude-sonnet; Antigravity va bajo gemini/*), de donde se deriva by_tier, más usage por task y por fix. Declarar proveedor y modelo no es opcional: desde 2026-09-02 el validador falla (antes: warning) si falta. Los arneses sin contador por sesión (Copilot, Antigravity) registran una estimación declarada con approx: true, y la vista Costos la muestra como estimado en la columna Origen — nunca se omite.',
  },
  steward: {
    kicker: '07 — el día a día',
    title: 'Un conserje para el kit: sdd-steward',
    lead: 'Desde v0.8.0 el kit trae su propio agente de entrada. Cualquier pedido sobre el kit — estado, updates, ideas, costos, salud de los arneses — se le habla directamente: lo resuelve él o lo rutea al agente dueño, sin bypassear un solo gate.',
    invokeNote: '/sdd-steward sin argumentos ejecuta el status completo. El mismo comando existe en los cuatro arneses — slash command en Claude Code, prompt en Copilot, workflow en Antigravity, comando TOML en Gemini CLI — y lo crea pnpm setup:agents.',
    examplesTitle: 'El día a día, en una línea',
    examples: [
      { cmd: '/sdd-steward', what: 'Status completo: versión del kit vs npm, perfil del repo (team/solo) y el flow que abre por defecto, módulos, ciclos en vuelo, fixes abiertos, memoria, validate y salud de los symlinks' },
      { cmd: '/sdd-steward pasame a perfil solo', what: 'Cambia sdd/global.json → profile y explica qué cambia: los ciclos nuevos se abren lite, los ya abiertos conservan su flow, y una spec que crea contratos que otro subproyecto consume vuelve a full. Es el único registro que el steward edita, y solo a pedido explícito' },
      { cmd: '/sdd-steward ¿qué me ahorra el flow lite?', what: 'Explica los flows desde sdd/dual-harness/rules/sdd-gates.md: plan.md en lugar de los cuatro documentos, un solo actor, el contexto leído una vez — con los invariantes y el cierre intactos' },
      { cmd: '/sdd-steward actualizá la librería', what: 'Conduce update sdd con el checklist post-update: conflictos *.new, setup:agents, validate en verde' },
      { cmd: '/sdd-steward arrancá esta idea: …', what: 'Intake mínimo y delegación a sdd-hermes — el loop idea → producto con sus checkpoints humanos' },
      { cmd: '/sdd-steward ¿cuánto gastamos por proveedor?', what: 'Agrega la telemetría de ciclos, tasks y fixes con las tarifas por proveedor/modelo de pricing.json' },
      { cmd: '/sdd-steward [BUGFIX] se rompió el login', what: 'Clasifica el prefijo y rutea al FIX GATE — la trazabilidad la pone el gate, no el steward' },
      { cmd: '/sdd-steward ¿cómo funciona el CONTEXTO GATE?', what: 'Responde desde sdd/documentation/ con lectura quirúrgica — sin cargar el kit entero en contexto' },
    ],
    manualNote: {
      title: 'Suma, no reemplaza',
      body: 'El steward es una puerta de entrada, no un peaje: todo lo que hacías a mano sigue funcionando exactamente igual — update sdd directo, /start-sdd-cycle, hermes, el visor, cada prompt y cada script. Usalo cuando quieras hablarle al kit; ignoralo cuando prefieras el comando.',
    },
  },
  catalog: {
    kicker: '08 — catálogo',
    title: 'Lo que puede generar',
    apps: 'Apps — 7 tipos',
    libs: 'Libs compartidas',
    services: 'Servicios Docker',
    dockerNote: 'docker-compose.yml con healthchecks, listo para levantar la infraestructura local del ciclo.',
  },
  kit: {
    kicker: '09 — el corazón',
    title: 'El kit SDD portable',
    lead: 'Todo lo que la CLI instala vive en una sola carpeta sdd/ copiada verbatim — diseñada para moverse entre repos sin editar un solo archivo.',
    scripts: 'Scripts que viajan con el kit',
    linkPre: 'Conocé ',
    linkPost: ' a fondo — capturas reales y las 16 vistas',
    update: {
      kicker: 'Actualizar el kit — sin miedo',
      title: 'Un comando trae todo lo nuevo. Lo tuyo no se toca.',
      p1: 'El update se gobierna por los hashes de ',
      p2: ': sabe exactamente qué archivo es del kit, cuál es tuyo y cuál modificaste. Al cierre regenera el catálogo, refresca los symlinks y corre ',
      p3: '.',
      rows: [
        { k: 'Tus datos', v: 'specs, ciclos, fixes, contextos, memoria — jamás se tocan' },
        { k: 'Kit sin modificar', v: 'se reemplaza por la versión nueva, silenciosamente' },
        { k: 'Archivos nuevos', v: 'se agregan solos (memoria, pricing, skills nuevas…)' },
        { k: 'Lo que editaste', v: 'queda intacto; la versión nueva aterriza al lado como *.new para fundir a mano' },
      ],
    },
  },
  start: {
    kicker: '10 — empezar',
    title: 'Tres comandos y estás adentro',
    steps: [
      { n: '01', t: 'Generá o instalá', c: 'npx @e-burgos/sdd-harness init', d: 'Monorepo Nx o standalone. Para un repo existente: harness configure sdd.' },
      { n: '02', t: 'Escribí tu primera spec — o tirá una idea', c: 'harness add spec mi-feature', d: 'El QUÉ antes del cómo. O harness idea "..." para que el agente arme todo el plan (flujo hermes).' },
      { n: '03', t: 'Arrancá el ciclo', c: '/start-sdd-cycle.prompt', d: 'Desde Claude Code, Copilot o Gemini: el orquestador toma la spec y el ciclo corre solo.' },
    ],
    examples: {
      title: '¿Preferís verlo antes?',
      lead: 'La salida de la CLI vive en su propio repo, un ejemplo por modo: un monorepo Nx (React + Spring Boot), una app standalone con Fastify, y un proyecto que ya existía y adoptó SDD sin tocar una línea de su código. Un workflow los regenera desde el paquete publicado en cada release, así nunca quedan atrás de npm.',
      cta: 'Ver los examples',
    },
  },
  footer: { by: 'Desarrollado por ' },
  viewer: {
    back: 'volver a la documentación',
    kicker: 'sdd:docs — la herramienta estrella',
    h1a: 'El sistema SDD tiene su propia cara.',
    h1b: ' Y vive dentro del kit.',
    b1: 'Los registros de SDD son JSON pensados para máquinas. ',
    b2: ' es su cara humana: un visor que lee global.json, specs, ciclos, tareas y catálogos ',
    bLive: 'en vivo',
    b3: ' y los convierte en un dashboard navegable — sin instalar nada, sin build, sin CDN.',
    cmdNote: '→ http://127.0.0.1:4310/sdd/docs/',
    shotAltPre: 'Vista ',
    shotAltPost: ' del visor sdd:docs',
    realNote: 'Capturas reales del visor corriendo sobre un workspace generado con harness init.',
    usage: {
      kicker: 'cómo se usa',
      title: 'Un comando, dieciséis vistas',
      lead: 'El visor se instala solo — viene adentro de sdd/docs/ en cada repo generado. No hay setup.',
      steps: [
        { n: '01', t: 'Levantalo', c: 'pnpm sdd:docs', d: 'Un server de solo módulos node:* sirve el visor en el puerto 4310. Sin npm install extra, sin build.' },
        { n: '02', t: 'Navegá por hash', c: '#/costs · #/cycles · #/agents', d: 'Router por hash con 16 vistas en 5 secciones. Cada spec, ciclo, task y fix con su detalle.' },
        { n: '03', t: 'Trabajá — se actualiza solo', c: '__state → re-render selectivo', d: 'En local pollea los registros por área cada 4s: cerrás un ciclo y la vista activa lo refleja sin recargar, preservando tu UI. El validador lo mantiene honesto.' },
      ],
      viewsHeading: 'Las 16 vistas',
    },
    principles: {
      kicker: 'por qué es así',
      title: 'Portable a propósito',
      lead: 'Cada decisión del visor sale de la misma regla que gobierna el kit: copiar sdd/ a otro repo tiene que funcionar sin editar nada.',
      footNote: 'Todo repo generado trae el visor adentro.',
    },
  },
  guia: {
    back: 'volver a la documentación',
    kicker: 'guía sdd — la documentación que viaja con el kit',
    h1a: 'El manual completo del sistema,',
    h1b: ' antes de instalarlo.',
    body: 'Estos documentos viven dentro de sdd/documentation/ en cada repo generado, en español e inglés — acá los podés leer completos: cómo instalar y actualizar el framework, la guía paso a paso para el día a día de un dev, y la referencia del sistema (gates, agentes, registros, reglas).',
    tabs: [
      { id: 'install', tab: 'INSTALL — instalar y actualizar' },
      { id: 'how-to', tab: 'HOW-TO — paso a paso' },
      { id: 'readme', tab: 'README — el sistema' },
    ],
    installedNote: ' — se instala tal cual en cada repo',
    tocHeading: 'En este documento',
    langNote: null as string | null,
  },
  usage: {
    back: 'volver a la documentación',
    kicker: 'cómo usarlo — de elegir el install a cerrar la primera spec',
    h1a: 'Cómo se usa esto,',
    h1b: ' paso a paso.',
    body: 'Cinco pestañas con el recorrido completo: elegir cuál de los tres modos de instalación te toca y qué contesta el wizard, cómo subir el kit de versión sin perder nada tuyo, qué exige el SPEC GATE en cada perfil, cuándo el FIX GATE es la salida correcta, y cómo se construye una spec de punta a punta hablándole al sdd-steward.',
    tocHeading: 'En esta pestaña',
  },
} as const;
