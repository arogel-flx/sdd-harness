# @e-burgos/sdd-harness

> CLI to bootstrap AI-agent-ready repos with SDD (Spec-Driven Development) methodology.

## Three modes

| Mode             | Command                        | What you get                                                                 |
| ---------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| **Nx monorepo**  | `harness init` → "Nx monorepo" | Full Nx workspace (`apps/`, `libs/`, `tools/`) + SDD system                   |
| **Standalone**   | `harness init --standalone`    | ONE app with its code at the repo root (no Nx) + SDD system                   |
| **SDD harness**  | `harness configure sdd`        | Only the SDD system + dual harness installed on an **existing** project       |

In standalone (and existing non-monorepo) repos, the project registers itself in the SDD
registries as a single logical app `apps/<name>` — the schemas keep their strict patterns,
every gate works unchanged, and the convention is documented in the generated subproject context.

> **See the output before running anything:**
> [**e-burgos/sdd-harness-examples**](https://github.com/e-burgos/sdd-harness-examples) holds one
> real, browsable example per mode — `flexi-market/` (Nx: React + Spring Boot), `pulse-api/`
> (standalone Fastify) and `legacy-shop/` (an existing project that adopted SDD without changing
> a line of its own code). A workflow regenerates them from the published package on every
> release, so they always match the version you are about to install.

## Features

- **Interactive scaffolding** — guided prompts to configure your entire workspace
- **7 app types** — NestJS, React, Next.js, Fastify, Hono, Spring Boot 3, Python
- **5 shared library types** — Types, Utils, UI Kit, API Client, Config
- **4 Docker services** — PostgreSQL, Redis, RabbitMQ, MinIO (with healthchecks)
- **Portable SDD system** — the full Spec-Driven Development kit (7 agents, 18 skills, gate prompts, strict JSON Schemas, validator scripts, docs viewer and scaffolding blueprints) copied verbatim; `sdd/global.json` is the single source of truth for project identity
- **Dual harness via symlinks** — `pnpm setup:agents` exposes agents/skills/prompts to Claude Code and GitHub Copilot from a single source
- **MCP server configuration** — Nx, GitHub, Playwright, Figma, Notion, Filesystem
- **Config-as-code** — optional `harness.config.ts` with Zod validation
- **Incremental** — add apps, services, and skills to existing workspaces
- **3-phase NX bootstrap** — installs and initializes NX before generating any app or lib

## Installation

```bash
# Run directly with npx (recommended)
npx @e-burgos/sdd-harness init

# Or install globally
npm install -g @e-burgos/sdd-harness
harness init

# With pnpm
pnpm dlx @e-burgos/sdd-harness init
```

**Requirements:** Node.js ≥ 18

## Quick Start

```bash
$ npx @e-burgos/sdd-harness init

┌  harness init
│
◆  Project name (Nx workspace): my-saas
◆  Project description: Multi-tenant SaaS platform
◆  npm package scope: @my-saas
◆  Which apps do you want to create?
│  ◻ NestJS API
│  ◻ React SPA
│  ◻ Python Agent
◆  Name for nestjs app: api
◆  Name for react app: webapp
◆  Name for python app: worker
◆  Which shared libraries do you want?
│  ◻ Shared Types
│  ◻ Shared Utils
◆  Which Docker services do you need?
│  ◻ PostgreSQL
│  ◻ Redis
│
◇  Configuration Summary
│
│  Project: my-saas
│  Scope: @my-saas
│  Apps: api (nestjs), webapp (react), worker (python)
│  Libs: shared-types, shared-utils
│  Services: postgres, redis
│  SDD: enabled (always)
│
◆  Proceed with this configuration? Yes
│
└  Done! Your workspace is ready.
```

## Commands

> **Running the CLI from an agent or from CI.** Every prompt has a flag, so the whole CLI is
> driveable without a TTY. This is not a convenience: an interactive prompt cannot be answered
> through stdin — @clack appends piped text to the initial value and never submits, so a
> command missing a flag **hangs** instead of failing. Pass the flags, and reach for
> `harness <command> --help` to see the ones you are missing.
>
> | Command             | Unattended form                                                                 |
> | ------------------- | -------------------------------------------------------------------------------- |
> | `init`              | `--config <path>` (the whole wizard as a validated file), plus `--here`/`--dir <path>` for the target, `--profile team\|solo` for the SDD working profile and `--skip-verify` to skip the closing gate |
> | `add app`           | `<type> --name <name>`                                                            |
> | `add tool`          | `<name> --type <what it is>`                                                      |
> | `add spec`          | `<slug> --author <user> --title <text> --app apps/<name> [--apps <a,b>] [--depends-on <id|slug>]` |
> | `add skill`         | `<name> --description <text>`                                                     |
> | `add service`       | `<type>`                                                                          |
> | `configure sdd`     | `--name <project> --description <text> [--profile team\|solo] [--apps name=path,...]` (plus `-y` only to reset an existing kit) |
> | `configure docker`  | `--services postgres,redis`                                                       |
> | `configure mcp`     | `--servers <a,b>`                                                                 |
> | `configure memory`  | `--providers <a,b>`                                                               |
> | `update sdd`        | `-y`                                                                              |
> | `idea`              | `["<text>"] [--author <user>] [--show] [--force]`                                 |
>
> **`NX_WORKSPACE_ROOT_PATH`.** If it is set and does not point at the current directory, `init`,
> every `add` subcommand, `update sdd` and the `sdd:*` scripts print a warning on their first
> line: any `nx …` run here would target THAT other workspace. Unset it before trusting
> lint/test/build locally.

### `harness init`

Initialize a new AI-agent-ready repo from scratch — Nx monorepo or standalone app.

```bash
harness init [--name <name>] [--mode nx|standalone] [--standalone] [--config <path>] [--here] [--dir <path>] [--profile team|solo] [--skip-verify] [-y|--yes]
```

| Flag             | Description                                 |
| ---------------- | -------------------------------------------- |
| `--name`         | Project name, must be kebab-case            |
| `--mode`         | `nx` (monorepo) or `standalone` (root app)  |
| `--standalone`   | Shortcut for `--mode standalone`            |
| `--config`       | Config file (`.json`, `.mjs`, `.js`) — fully non-interactive, agent/CI-friendly |
| `--here`         | Generate in the current directory instead of `./<name>` |
| `--dir <path>`   | Target directory (`.` = here). Default: `./<name>` |
| `--profile`      | SDD working profile written to `sdd/global.json`: `team` (full cycles, default) or `solo` (lite cycles, single actor). With `--config`, `sdd.profile` wins |
| `--skip-verify`  | Skip the closing FASE 3 gate (see below)    |
| `-y, --yes`      | Skip the confirmation prompt                |

**Where it generates.** In the current directory when: `--here` (or `--dir .`) is passed, the
`--config` file lives in the cwd, or `basename(cwd)` already equals the project name — the last
one covers a directory you already `git init`-ed and ran `harness idea` in, which used to force
you to flatten a nested `<name>/<name>/` by hand. Otherwise it generates in `./<name>` as before.
If the cwd is already a git repo, `init` does **not** run `git init` — it commits on the current
branch instead, and a pre-existing `.gitignore` is merged rather than overwritten. Any
`harness.idea.md` / `harness.config.json` / `harness.config.schema.json` sitting next to the
config travel into the generated workspace.

**Closing verification gate (FASE 3).** After generating, `init` runs `sdd:validate` plus
`nx run-many -t lint test build` (Nx mode) or the `lint`/`test`/`build` scripts from
`package.json` (standalone mode) — printed and executed, not just described. If anything is red,
`init` **fails with exit 1 and skips the initial commit**. Pass `--skip-verify` to opt out.

**What else it writes.** A root `README.md` (apps with their type, port and dev command) if one
does not already exist, and `.env.example` **always** — one `<APP>_PORT=` line per app (see the
"Configuration File" section below for the naming rule) in addition to the service variables.

**Interactive prompts (Nx monorepo):**

1. **Project name** — lowercase kebab-case identifier
2. **Description** — brief project description
3. **Mode** — Nx monorepo | Standalone app (skipped if `--mode`/`--standalone` given)
4. **Package scope** — npm org scope (e.g. `@my-saas`)
5. **Apps** — multi-select from the app catalog
6. **App names** — name each selected app (with smart defaults)
7. **Libraries** — multi-select from the lib catalog
8. **Lib names** — name each selected library
9. **Docker services** — multi-select infrastructure services
10. **Confirmation** — review summary before generation

**Interactive prompts (standalone):** project name → description → ONE app type → Docker services → confirmation. The app code lands at the repo root (no `apps/`, no `nx.json`): react and springboot come from the kit blueprints root-ified; nestjs uses `@nestjs/cli`, nextjs plain Next, fastify/hono run with `tsx` + `tsc`, python ships `pyproject.toml`. The root `package.json` always carries the `sdd:*` harness scripts (for Java/Python it exists solely for the harness plus `mvn`/`pytest` convenience scripts).

**What gets generated:**

```
my-saas/
├── apps/
│   ├── api/                    # NestJS app
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   └── app/
│   │   │       ├── app.module.ts
│   │   │       ├── app.controller.ts
│   │   │       └── app.service.ts
│   │   ├── project.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.app.json
│   └── webapp/                 # React app
│       ├── src/
│       │   ├── main.tsx
│       │   └── app/app.tsx
│       ├── index.html
│       ├── vite.config.ts
│       ├── project.json
│       └── tsconfig.json
├── libs/
│   ├── shared-types/
│   │   ├── src/index.ts
│   │   ├── project.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.lib.json
│   └── shared-utils/
│       ├── src/index.ts
│       ├── project.json
│       ├── tsconfig.json
│       ├── tsconfig.lib.json
│       └── tsconfig.spec.json
├── sdd/
│   ├── context/
│   │   ├── constitution.md
│   │   └── context_prompt.md
│   ├── agents/
│   │   ├── sdd-orchestrator.agent.md
│   │   └── ...
│   ├── prompts/
│   │   └── ...
│   ├── skills/
│   │   ├── sdd-orchestrator/SKILL.md
│   │   ├── generate-nestjs-module/SKILL.md
│   │   └── generate-react-component/SKILL.md
│   ├── global.json
│   ├── schema.json
│   ├── api.json
│   ├── components.json
│   └── tasks.json
├── docker-compose.yml
├── .env.example
├── AGENTS.md
├── SPEC.md
├── nx.json
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

### `harness idea`

The single entry point of the hermes end-to-end flow: persist a product idea in natural
language and scaffold everything an AI agent needs to take it to product.

```bash
harness idea ["una app para gestionar turnos de peluquería"] [--author <gh-user>] [--show] [--force]
```

| Flag       | Description                                                                          |
| ---------- | ------------------------------------------------------------------------------------- |
| `text`     | (positional, optional) The idea, in natural language — omit it to be prompted         |
| `--author` | GitHub user — lands in `sdd.author` of the config stub and signs the specs (`add spec` / `sdd.modules`) |
| `--show`   | Print the registered idea, discovery evidence and dev decisions instead of writing (see below) |
| `--force`  | Overwrite existing idea/config files                                                  |

What it writes (never overwrites without `--force`):

- `harness.idea.md` — the idea verbatim + a **self-sufficient protocol for FASE 1–3**
  (need→piece decision matrix, the standalone-vs-nx rule, the `init` command with the note on
  generating in the cwd) — because on an empty repo the `sdd-hermes` skill does not exist yet.
  It also carries two sections the agent fills during FASE 1 and later specs cite: a
  `## Evidencia del descubrimiento` table (Fuente | Estado de acceso | Dato medido | Fecha) and
  a `## Decisiones del dev` log (each entry dated).
- On an empty repo it also writes `harness.config.json` (stub for `init --config`, with
  `apps[0].port` and `sdd: { author?, modules: [] }` pre-filled) and
  `harness.config.schema.json` (JSON Schema so the agent validates the config it fills).
- Inside an existing SDD workspace it writes only the idea file, with the gap-analysis
  protocol (`harness add app|service|spec`) instead of `init`.

Run `harness idea --show` to print the registered idea plus the evidence table and decisions —
handy to resume work (together with `sdd/prompts/hermes-resume.prompt.md`) without rereading the
whole file.

The intelligence lives in the kit's `sdd-hermes` skill — this command just materializes
the deterministic entry point for it.

### `harness config schema`

Print (or write) the JSON Schema of the `init --config` contract, derived from the same
zod schema the CLI validates with — agents and editors can validate a config without
running the CLI.

```bash
harness config schema                                  # stdout
harness config schema --out harness.config.schema.json # file
```

### `harness add app`

Add a new application to an existing workspace.

```bash
harness add app [type] [--name <name>]
```

| Argument | Description                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------------- |
| `type`   | (positional, optional) One of: `nestjs`, `react`, `nextjs`, `python`, `fastify`, `hono`, `springboot` |
| `--name` | App name in kebab-case                                                                                |

If arguments are omitted, interactive prompts will guide you.

Besides generating the app and registering it in the SDD registries, the command updates the
root `package.json` exactly as if the app had been declared in `init --config`: the four nx
convenience scripts (`<name>`, `build:<name>`, `test:<name>`, `lint:<name>`) plus the app type's
runtime dependencies (additive — existing versions are never overwritten). Run your package
manager install afterwards.

```bash
# Interactive
harness add app

# Non-interactive
harness add app nestjs --name payments-api
```

---

### `harness add tool`

Register a tool as an SDD subproject. Unlike `add app` it **generates no code**: a tool is
whatever the team writes under `tools/<name>/` (scripts, internal CLIs, generators). What the
command adds is what was missing for the tool to exist for the system.

```bash
harness add tool [name] [--type <what it is>]
```

| Argument | Description                                                          |
| -------- | -------------------------------------------------------------------- |
| `name`   | (positional, optional) Tool name in lowercase kebab-case             |
| `--type` | One line describing what it is; it lands in `global.json` (default: `tool`) |

It writes the entry in `sdd/global.json → monorepo.tools` — an optional key created with the
first tool — and creates `sdd/context/tools/<name>/` with `constitution.md`, `context_prompt.md`
and `updates/`. From there the docs viewer lists the tool under Context and on the Dashboard, and
SPEC GATE B can require its `constitution.md` when a cycle touches it.

```bash
# Interactive
harness add tool

# Non-interactive
harness add tool qa-flows --type "playwright QA scripts"
```

---

### `harness add service`

Add a Docker service to the workspace. Automatically merges with existing services in `docker-compose.yml`.

```bash
harness add service [type]
```

| Argument | Description                                                             |
| -------- | ----------------------------------------------------------------------- |
| `type`   | (positional, optional) One of: `postgres`, `redis`, `rabbitmq`, `minio` |

- Detects services already in `docker-compose.yml` and excludes them from selection
- Regenerates the full `docker-compose.yml` with existing + new services
- Updates `.env.example` with relevant environment variables

```bash
# Interactive (shows only services not yet configured)
harness add service

# Direct
harness add service rabbitmq
```

---

### `harness add skill`

Create a new custom agent skill in `sdd/skills/`.

```bash
harness add skill [name] [--description <text>]
```

| Argument        | Description                                     |
| --------------- | ----------------------------------------------- |
| `name`          | (positional, optional) Skill name in kebab-case |
| `--description` | Skill description — skips the prompt            |

Generates a `SKILL.md` template:

```bash
$ harness add skill data-import

✓ Skill created at sdd/skills/data-import/SKILL.md
```

Generated file (`sdd/skills/data-import/SKILL.md`):

```markdown
# data-import

Imports CSV/JSON data into the database

## Trigger

"Usá el skill data-import para [tarea]"

## Workflow

1. Leer contexto relevante del workspace
2. Ejecutar la tarea según las instrucciones
3. Validar el resultado

## Output

<!-- Describir qué genera este skill -->
```

> Skills are written as `SKILL.md` (uppercase) — the Agent Skills standard Claude Code requires; a lowercase `skill.md` is not discovered on case-sensitive filesystems. Run `pnpm sdd:rebuild-catalog` afterwards so the docs viewer picks it up.

---

### `harness add spec`

Create a new SDD specification with the v2.0 multi-developer structure.

```bash
harness add spec [slug] [--author <gh-user>] [--title <text>] [--app <apps/name>] [--apps <a,b>] [--depends-on <id|slug>] [--description <text>]
```

Creates `sdd/specs/spec-[author]-[NNN]-[slug]/` (spec file + `cycles/` + `fixes/`), computes the per-author `NNN` counter, registers the entry in `sdd/specs/index.json` with `status: "draft"` and runs `sdd:validate`.

| Argument        | Description                                                                  |
| --------------- | ----------------------------------------------------------------------------- |
| `slug`          | (positional, optional) Spec slug in kebab-case                               |
| `--author`      | GitHub username — the per-author counter keys off this                       |
| `--title`       | Spec title — skips the prompt, defaults to the slug                          |
| `--app`         | Main subproject affected, `(apps\|libs\|tools)/<name>` — SPEC GATE needs it   |
| `--apps`        | Every subproject the module touches, comma-separated or repeated (`apps/a,libs/b`) — `--app` is always included |
| `--depends-on`  | Spec ids or slugs this spec depends on, comma-separated or repeated — resolved against `sdd/specs/index.json` |
| `--description` | One-liner for the `pending_modules` entry — defaults to the title            |

```bash
$ harness add spec user-onboarding --author jdoe --title "User onboarding" --app apps/core-api
# → sdd/specs/spec-jdoe-001-user-onboarding/spec-jdoe-001-user-onboarding.spec.md
```

The index's `status` field is one of `draft | in-progress | completed | cancelled` — a spec is
born `draft` and the `sdd-orchestrator` moves it to `in-progress` when it opens `cycle-01`. The
command also registers the module in `pending_modules` of `sdd/global.json` automatically
(`{ module, spec, apps, cycles_completed: 0, description }`, `depends_on` resolved to spec ids in
order) — previously that entry had to be written by hand.

---

### `harness update sdd`

Update the installed SDD kit to the version bundled with the CLI — **preserving everything that
is yours**. Works identically in the three modes.

```bash
npx @e-burgos/sdd-harness@latest update sdd [-y]
```

How it decides, file by file (against the hash baseline in `sdd/kit.json`, written at install):

| Situation                                        | Action                                         |
| ------------------------------------------------ | ---------------------------------------------- |
| Kit file you never touched, new kit changed it   | Replaced with the new version                  |
| Kit file you modified, kit did not change it     | Kept as-is                                     |
| Kit file you modified AND the kit changed it     | Yours is kept; new version lands as `<file>.new` + conflict report |
| File you added (custom skills, etc.)             | Never touched                                  |
| Your data (`global.json`, `specs/`, `fixes/`, `context/**`, registries) | **Never touched, ever**  |

Then it re-merges the `sdd:*` scripts into `package.json`, refreshes the harness symlinks
(`setup:agents`, so new skills become visible), regenerates `catalog.json` and runs
`sdd:validate` — if new schemas are stricter than your existing registries, the report tells you
exactly what to migrate.

Installations made before the manifest existed run a one-time **conservative mode** (asks for
confirmation): pure kit dirs are replaced, hybrids (`dual-harness/`, global
`constitution.md`/`context_prompt.md`) are never overwritten, and the manifest is written so the
next update is surgical.

---

### `harness configure docker`

Regenerate `docker-compose.yml` with a new selection of services. Replaces the entire file.

```bash
harness configure docker [--services postgres,redis,rabbitmq,minio]
```

Presents a multi-select with all 4 services, pre-selecting any already configured. Useful to remove services or start fresh. With `--services` it runs unattended; unknown values fail with the valid list.

---

### `harness configure sdd`

Configure or reset the SDD (Spec-Driven Development) agent infrastructure.

```bash
harness configure sdd [--name <project>] [--description <text>] [--profile team|solo] [--apps name=path,...] [-y]
```

| Argument        | Description                                                                       |
| --------------- | --------------------------------------------------------------------------------- |
| `--name`        | Project name — skips the prompt (defaults to `package.json` name or the directory) |
| `--description` | Project description — skips the prompt                                             |
| `--profile`     | Working profile written to `sdd/global.json`: `team` (full cycles, default) or `solo` (lite cycles) |
| `--apps`        | Applications to register as `name=path` pairs, comma-separated (`--apps api=src/api,web=src/web`). Skips detection. Paths are relative to the repo root and must exist |
| `-y`, `--yes`   | Skip the reset confirmation. **Destructive** when `sdd/` already exists            |

- **Shape detection**: Nx monorepo (`nx.json`/`apps/`) → registers every app in `apps/` **plus** every `project.json` with `projectType: "application"` found elsewhere (`src/<name>`, `packages/<name>`...; `node_modules`, build outputs and `sdd/` are skipped, and a nested workspace is not descended into). Otherwise the repo registers as a single logical app (standalone convention). App types are inferred from stack markers (`pom.xml`, `nest-cli.json`, `vite.config.ts`, ...)
- **Apps outside `apps/`** keep the logical id `apps/<name>` in every SDD registry (the schemas require it, and `sdd:gate` only looks at `sdd/context/apps/<name>/`); `sdd/global.json` records where the code really lives (`src/api — springboot (código en src/api; id lógico apps/api)`) and the generated `constitution.md` opens with the same note. A monorepo where no application can be found **fails instead of installing an empty kit** — pass `--apps`
- **Automatic `package.json` merge**: injects the `sdd:*` + `setup:agents` scripts and `ajv`/`ajv-formats` devDependencies without touching your existing scripts — and creates a minimal `package.json` if the repo has none (pure Java/Python repos)
- **Absorbs your existing `AGENTS.md`/`CLAUDE.md`**: their content is preserved under an "Instrucciones previas del proyecto" section inside `sdd/dual-harness/` before the root files become symlinks — nothing is lost
- **Keeps your existing `.claude/`, `.github/` and `.agents/` content**: real directories are not replaced — the kit agents/skills/prompts are linked inside them, and a name collision (say, your own `.github/skills/sdd-reviewer/`) keeps yours and leaves the kit version next to it as `<name>.new`, listed at the end of `setup:agents`
- If `sdd/global.json` already exists, asks for confirmation before resetting the whole `sdd/` directory (or warns and proceeds with `-y`)
- After install: run `pnpm install` (so `sdd:validate` finds ajv) and fill the `[...]` markers in `sdd/context/`

---

### `harness configure mcp`

Configure MCP (Model Context Protocol) servers for AI agent integration.

```bash
harness configure mcp [--servers <a,b,c>]
```

Presents a multi-select from the MCP catalog, pre-selecting any already in `.mcp.json`. Generates a `.mcp.json` file at workspace root. `--servers` takes catalog keys and runs unattended.

**Available MCP servers:**

| Server       | Description              | Package                                   |
| ------------ | ------------------------ | ----------------------------------------- |
| `nx-mcp`     | Nx workspace tools       | `nx-mcp`                                  |
| `github`     | Issues, PRs, repos       | `@modelcontextprotocol/server-github`     |
| `playwright` | Browser automation       | `@playwright/mcp@latest`                  |
| `figma`      | Design file access       | `@anthropic/mcp-server-figma`             |
| `notion`     | Notion pages & databases | `@notionhq/mcp-server`                    |
| `filesystem` | File read/write ops      | `@modelcontextprotocol/server-filesystem` |

---

### `harness configure memory`

Opt-in memory providers (MCP) **on top of** the kit's portable base layer. The base —
`sdd/memory/lessons.md` + `sdd/memory/journal/` (MEMORIA GATE) — is plain versioned
files and needs no runtime; these providers add optional semantic retrieval.

```bash
harness configure memory [--providers <a,b,c>]
```

Merges into `.mcp.json` without touching other configured MCP servers (deselecting a
provider removes only that provider). `--providers` takes catalog keys and runs
unattended. No API keys, no paid services:

| Provider          | What it adds                              | Runtime            |
| ----------------- | ----------------------------------------- | ------------------ |
| `basic-memory`    | Markdown notes + wikilinks, local-first   | `uvx basic-memory` |
| `knowledge-graph` | Entity/relation graph persisted **inside the repo** at `sdd/memory/knowledge-graph.json` | `npx @modelcontextprotocol/server-memory` |

---

### `harness info`

Display workspace information at a glance.

```bash
harness info
```

Example output:

```
┌  harness info
│
◇  Project
│  Name: @my-saas/source
│  Scope: @my-saas
│  Version: 0.1.0
│
◇  Apps (2)
│    • api
│    • webapp
│
◇  Libs (2)
│    • shared-types
│    • shared-utils
│
◇  Docker Services (2)
│    • postgres
│    • redis
│
◇  SDD Status
│  Project: my-saas
│  Current Cycle: 1
│  Status: active
│  Completed: auth, users
│
│  ✓ Nx workspace detected
│
└
```

---

## App Catalog

| Type         | Default Name | Framework                  | NX Plugin    | Targets                                               | Key Files Generated                                                       |
| ------------ | ------------ | -------------------------- | ------------ | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| `nestjs`     | `api`        | NestJS 11                  | `@nx/webpack/plugin` (build inference) + `@nx/jest:jest` | build (inferred), serve, lint, test  | `main.ts`, `app.module.ts`, `app.controller.ts`, `app.service.ts`, `webpack.config.js`, `jest.config.js` |
| `react`      | `webapp`     | React 19 + Vite (blueprint `react-app`) | `@nx/react`  | build, serve, lint, test                 | `main.tsx`, `app/` + `pages/` with react-router, `vite.config.ts`, `Dockerfile`, `nginx.conf` |
| `nextjs`     | `web`        | Next.js (App Router)       | `@nx/next`   | build, serve, lint                                    | `app/layout.tsx`, `app/page.tsx`, `next.config.js`                        |
| `fastify`    | `api`        | Fastify + esbuild          | `@nx/node`   | build, serve, lint                                    | `main.ts` with health endpoint                                            |
| `hono`       | `api`        | Hono 4 + @hono/node-server | `@nx/node`   | build, serve, lint, test                              | `main.ts`, `vite.config.ts`, tsconfig files                               |
| `springboot` | `service`    | Spring Boot 3.5 + Java 21 (blueprint `java-api`) | — (Maven vía `nx:run-commands`) | build, test, serve, lint, coverage | Hexagonal architecture (`domain/`, `infrastructure/`), `pom.xml`, `Dockerfile` |
| `python`     | (same)       | Python 3.11+               | —            | serve, lint, test                                     | `__main__.py`, `pyproject.toml`, `tests/`                                 |

> **Spring Boot**: el blueprint `sdd/templates/apps/java-api` integra Maven a Nx vía `nx:run-commands` (`build`/`test`/`serve`/`lint`/`coverage` → `mvn`): la app queda visible para `nx affected` y `nx run-many` sin plugin de Gradle/Maven. Requiere Java 21 y Maven instalados.
> **Hono**: usa `@nx/vite:build` en modo librería con `target: node18`. Las dependencias `hono` y `@hono/node-server` se añaden a `dependencies` del workspace.
> **NestJS** (Nx mode): `build` is inferred — `@nx/webpack/plugin` registered in `nx.json` plus each app's `webpack.config.js` with `NxAppWebpackPlugin` (the `@nx/webpack:webpack` executor is deprecated, and without an explicit `webpackConfig` it used to fail with "Can't resolve './src'"). Tests run via `@nx/jest:jest` with a CommonJS `jest.config.js` (a `.ts` config would need `ts-node`, which the workspace does not install) + a root `jest.preset.js` + `tsconfig.spec.json`. `serve` runs node over the built bundle and depends on `build`.

## Lib Catalog

| Type           | Tags                             | Targets    | Description                   |
| -------------- | -------------------------------- | ---------- | ----------------------------- |
| `shared-types` | `scope:shared, type:types`       | lint       | TypeScript interfaces & DTOs  |
| `shared-utils` | `scope:shared, type:utils`       | lint, test | Helper functions & validators |
| `ui-kit`       | `scope:shared, type:ui`          | lint, test | Shared React components (JSX) |
| `api-client`   | `scope:shared, type:data-access` | lint, test | Typed HTTP client for backend |
| `config`       | `scope:shared, type:config`      | lint       | Env vars, constants, schemas  |

## Docker Services Catalog

| Service    | Image                          | Ports           | Environment Variables               | Healthcheck                    |
| ---------- | ------------------------------ | --------------- | ----------------------------------- | ------------------------------ |
| `postgres` | `postgres:16-alpine`           | `5432:5432`     | `DB_USER`, `DB_PASSWORD`, `DB_NAME` | `pg_isready -U $POSTGRES_USER` |
| `redis`    | `redis:7-alpine`               | `6379:6379`     | —                                   | `redis-cli ping`               |
| `rabbitmq` | `rabbitmq:3-management-alpine` | `5672`, `15672` | `RABBITMQ_USER`, `RABBITMQ_PASS`    | `rabbitmq-diagnostics -q ping` |
| `minio`    | `minio/minio:latest`           | `9000`, `9001`  | `MINIO_USER`, `MINIO_PASSWORD`      | —                              |

All services include `restart: unless-stopped` and named volumes where applicable.

## SDD (Spec-Driven Development)

SDD is a methodology where every feature goes through a structured cycle of specialized AI agents before code is written. Harness installs the **portable SDD kit** verbatim from `templates/sdd/` — the same folder documented by its own `sdd/documentation/` (INSTALL, HOW-TO and full reference, in Spanish and English — `sdd/README.md` is the bilingual index) once installed.

The kit is portable by design: **`sdd/global.json` is the single source of truth for the project name and description**. No other kit file hardcodes them, and `pnpm sdd:validate` fails if they leak. That is what allows the CLI to copy the kit without rendering templates.

### What Gets Generated

| File/Dir                  | Purpose                                                                  |
| ------------------------- | ------------------------------------------------------------------------ |
| `sdd/global.json`         | Central project state (name, description, modules) — single source of truth |
| `sdd/context/`            | Global constitution + context prompt (with `[...]` markers to fill)      |
| `sdd/context/apps\|libs/` | Per-subproject context (constitution, context prompt, additive `updates/`) |
| `sdd/specs/`              | Spec registry (`index.json`) + one folder per spec with its cycles/fixes |
| `sdd/schemas/`            | Strict JSON Schemas for every registry (`additionalProperties: false`)   |
| `sdd/schema.json` / `api.json` / `components.json` / `fixes.json` / `tasks.json` | State registries, all schema-validated |
| `sdd/agents/`             | The 7 SDD cycle agents                                                   |
| `sdd/skills/`             | 16+ skills (cycle, scaffold-nx, init-nx-workspace, code generators)      |
| `sdd/prompts/`            | Gate prompts (SPEC GATE, FIX GATE, start/review cycle)                   |
| `sdd/templates/`          | Scaffolding blueprints: nx-workspace, java-api, react-app, ts-lib        |
| `sdd/scripts/`            | `validate-sdd.mjs`, `spec-gate.mjs` (the SPEC GATE as a command), `rebuild-tasks-index.mjs`, `rebuild-catalog.mjs`, `setup-agents`, `setup-rtk.mjs` + `rtk-hook.mjs` (rtk bridge/installer) |
| `sdd/docs/`               | Zero-dependency docs viewer (`pnpm sdd:docs`) — includes the **Costos** dashboard in four tabs with charts (General · Specs · Fixes · RTK token savings) and live auto-refresh on registry changes |
| `sdd/memory/`             | Portable self-learning layer: `lessons.md` (distilled, read every session) + `journal/` (episodic, MEMORIA GATE) |
| `sdd/pricing.json`        | Editable rates feeding the Costos dashboard (hourly rate + $/MTok per model tier) |
| `sdd/tools.json`          | Switch for the kit's helper tools — today [rtk](https://github.com/rtk-ai/rtk), which compresses shell output for the agents and ships **on by default** (`pnpm sdd:rtk -- --disable` turns it off; `update sdd` never overwrites this file) |
| `sdd/dual-harness/`       | Source of truth for root `AGENTS.md` / `CLAUDE.md` / `GEMINI.md`, plus `rules/` — the canonical gates (`sdd-gates.md`) and telemetry contract (`sdd-model-budget.md`) the root files point at — and `copilot-instructions.md`, seeded into `.github/` by `setup:agents` when that file does not exist |
| `AGENTS.md` / `CLAUDE.md` | **Symlinks** to `sdd/dual-harness/` (created by `pnpm setup:agents`)     |
| `.claude/` / `.github/`   | Symlinks exposing agents, skills and prompts to Claude Code & Copilot    |
| `.claude/settings.json` / `.gemini/settings.json` | Pre-command hooks routing shell commands through the rtk bridge (merged, never clobbered) |
| `.nxignore`               | Keeps `sdd/templates` blueprints out of the Nx project graph             |

The root `package.json` ships the kit scripts: `setup:agents`, `sdd:docs`, `sdd:validate`, `sdd:gate` (answers the SPEC GATE for a spec or a cycle), `sdd:rebuild-tasks-index`, `sdd:rebuild-catalog`, `sdd:rtk` and — when the project has none of its own — a `postinstall` that keeps the rtk binary installed for whoever clones the repo (plus `ajv`/`ajv-formats` as devDependencies for the validator).

### The SDD Cycle

```
1. Orchestrator  → Validates SPEC GATE, creates brief.yaml + cycle.json
2. Functional    → Generates user stories & requirements     ┐
3. Planner       → Creates cycle tasks.json + planner.md     ├ (parallel)
4. Architect     → Defines DB schema & API contracts         ┘
5. Implementor (Back)  → Implements backend tasks
6. Implementor (Front) → Implements frontend tasks
7. Reviewer      → VALIDATION GATE + CONTEXTO GATE, closes cycle
```

Specs follow the v2.0 multi-developer convention: `sdd/specs/spec-[gh-user]-[NNN]-[slug]/` with per-spec cycles and per-author counters. `harness add spec` creates the structure and registers it in `sdd/specs/index.json`.

### SPEC GATE as a Command

The gate is no longer a checklist an agent reads by hand — a script answers it, at two moments:

```bash
pnpm sdd:gate <spec-id|slug>            # GATE A — can a cycle be opened for this spec?
pnpm sdd:gate <spec-id|slug> cycle-XX   # GATE B — can code be written in this cycle?
pnpm sdd:gate <spec-id|slug> --json     # same answer, structured for agents
```

It prints one line per condition (✔/✘) and ends in `APPROVED` or `BLOCKED` — exit `0` when it
passes, `1` when blocked, `2` on a usage error. GATE A also prints the next cycle id, the
suggested flow and the active profile. GATE B is flow-aware: it requires the documents of the
cycle's own `flow`. The script only reads; it writes nothing. The canonical definition lives in
`sdd/dual-harness/rules/sdd-gates.md`, which the root harness files, the prompts and the agents
all point at.

### Profiles: `team` and `solo`

`sdd/global.json → profile` decides the **flow** new cycles open with (`--profile` on `init` /
`configure sdd`, or `sdd.profile` in the config file; absent = `team`):

| Profile | Flow of new cycles | Shape                                                                                                    |
| ------- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| `team`  | `full`             | One role per document (brief · functional · planner · architect), implementors, reviewer; FIX GATE with questionnaire |
| `solo`  | `lite`             | A single actor opens, implements and closes; `plan.md` replaces the four documents; short FIX GATE       |

A `[LITE]` / `[FULL]` prefix in the request wins over the profile, and a spec whose contracts
another subproject consumes (new tables or endpoints) or that has dependents opens `full` anyway.
The invariants never change: spec registered, `cycle.json` in-progress before the code,
`tasks.json` with tasks, `usage` on every task, and the close gates plus `pnpm sdd:validate`
green. The `sdd-steward` switches the profile on the dev's request.

### Scaffolding Blueprints

`react` and `springboot` apps and TS libs are generated from the kit's own blueprints (`sdd/templates/apps/react-app`, `sdd/templates/apps/java-api`, `sdd/templates/libs/ts-lib`) with token renaming — the same overlay the `scaffold-nx` skill documents. Spring Boot integrates with Nx through Maven via `nx:run-commands` (no Gradle required).

## Configuration File (`init --config`)

For repeatable setups — and for AI agents / CI, which cannot answer interactive
prompts — define a config file. Formats: plain `.json`, or `.mjs`/`.js` with a default
export via `defineConfig` (TypeScript configs must be compiled first). `harness idea`
scaffolds a JSON stub plus its JSON Schema; `harness config schema` prints the schema.

```javascript
// harness.config.mjs
import { defineConfig } from "@e-burgos/sdd-harness";

export default defineConfig({
  mode: "nx", // or "standalone" (exactly one app, code at repo root)
  project: {
    name: "my-saas",
    description: "Multi-tenant SaaS platform",
    packageScope: "@my-saas",
  },
  apps: [
    { name: "api", type: "nestjs", port: 3000, features: [] },
    { name: "webapp", type: "react", port: 4200, features: [] },
    { name: "worker", type: "python", features: [] },
  ],
  libs: [
    { name: "shared-types", type: "shared-types" },
    { name: "api-client", type: "api-client" },
  ],
  services: [
    { type: "postgres", port: 5432 },
    { type: "redis", port: 6379 },
  ],
  sdd: {
    enabled: true,
    author: "jdoe", // GitHub user — signs the seeded specs (spec-jdoe-NNN-<slug>)
    profile: "team", // "team" → full cycles (default) | "solo" → lite cycles
    modules: [
      "auth", // plain slug
      {
        name: "billing",
        title: "Billing",
        description: "Invoicing and subscriptions",
        app: "apps/api", // main subproject — defaults to the first app
        apps: ["apps/api", "apps/webapp"], // every subproject the module touches
        depends_on: ["auth"], // slugs of other modules in this same config
      },
    ],
    cycles: [
      { cycle: 1, modules: ["auth", "users"], weeks: 2 },
      { cycle: 2, modules: ["billing"], weeks: 1 },
    ],
    skills: {
      include: ["sdd-*", "generate-*", "nx-*"],
      custom: ["data-import"],
    },
    agents: {
      instructionFile: "AGENTS.md",
      claudeFile: "CLAUDE.md",
      copilotInstructions: true,
    },
  },
  nx: {
    plugins: ["@nx/webpack", "@nx/vite", "@nx/eslint"],
    defaultProject: "api",
  },
  npm: {
    scopes: [
      // → `@my-org:registry=https://npm.pkg.github.com` line in the generated .npmrc.
      // Only the URL lands in the repo's .npmrc — the credential goes in the dev's local
      // ~/.npmrc and NODE_AUTH_TOKEN in CI, never committed.
      { scope: "@my-org", registry: "https://npm.pkg.github.com" },
    ],
  },
  infra: {
    provider: "digitalocean",
  },
});
```

Then run (no prompts at all — validation errors report the exact config path):

```bash
harness init --config harness.config.mjs   # or harness.config.json
```

Each entry in `sdd.modules` is seeded by `init` as a `draft` spec
(`spec-<sdd.author>-NNN-<slug>`) plus an entry in `pending_modules` of `sdd/global.json`,
resolving `depends_on` slugs to spec ids in declaration order — the same registration
`harness add spec` does, but for the whole initial backlog at once.

### Config Schema

The configuration is validated with Zod (JSON Schema export: `harness config schema`).
Key constraints:

- `mode` — `nx` (default) or `standalone` (requires exactly one app)
- `project.name` — lowercase kebab-case
- `project.packageScope` — npm scope like `@my-project`
- `apps[].name` — lowercase kebab-case
- `apps[].type` — one of: `nestjs`, `react`, `nextjs`, `python`, `fastify`, `springboot`, `hono` (the same seven the wizard offers)
- `apps[].port` — optional; when set it flows into the app's own default
  (`Number(process.env['<APP>_PORT'] ?? process.env['PORT'] ?? <port>)`, `server.port` for Vite
  apps), into `.env.example` and into the root `README.md`. The per-app env var is derived from
  the name, e.g. `catalog-api` → `CATALOG_API_PORT`.
- `libs[].type` — one of: `shared-types`, `shared-utils`, `ui-kit`, `api-client`, `config`
- `services[].type` — one of: `postgres`, `redis`, `rabbitmq`, `minio`
- `services[].port` — optional, between 1000 and 65535 (catalog defaults apply)
- `sdd.author` — optional GitHub username (lowercase); signs the specs seeded from `sdd.modules`
- `sdd.profile` — optional `team` (full cycles, default) or `solo` (lite cycles, single actor); written to `sdd/global.json` only when set, and it wins over `--profile`
- `sdd.modules[]` — a string slug, or an object `{ name, title?, description?, app?, apps?, depends_on? }` — each seeds a `draft` spec + a `pending_modules` entry at `init` time
- `npm.scopes[]` — `{ scope: "@org", registry: "<url>" }` — becomes `@org:registry=<url>` lines in the generated `.npmrc` (URL only, never a credential)
- `infra.provider` — one of: `digitalocean`, `aws`, `gcp`, `vercel`, `railway`

## Contributing / Development

The CLI lives in `apps/cli/` of the [sdd-harness](https://github.com/e-burgos/sdd-harness) workspace.

```bash
# Clone and install (workspace root)
git clone https://github.com/e-burgos/sdd-harness
cd sdd-harness
pnpm install

# Build, typecheck and test (root scripts proxy to apps/cli)
pnpm build
pnpm typecheck
pnpm test

# Run locally
node apps/cli/bin/harness.mjs init
```

Real end-to-end trials go under `examples/` (gitignored) — see `AGENTS.md` at the repo root
for the working rules.

### Adding a New Generator

1. Create `apps/cli/src/generators/<name>.generator.ts` with an exported async function
2. Wire it into `apps/cli/src/generators/index.ts`
3. If it needs a command, add to `apps/cli/src/commands/` and register in the CLI

### Adding a New Command

1. Create the command file using `defineCommand` from `citty`
2. Use `@clack/prompts` for interactive UX
3. Register in the appropriate parent command (root, `add`, or `configure`)

## License

MIT © [e-burgos](https://github.com/e-burgos)

````

### `harness configure`

Configure workspace features.

```bash
harness configure sdd      # Set up SDD methodology
harness configure mcp      # Configure MCP servers
harness configure docker   # Generate/update Docker Compose
````

### `harness info`

Display workspace information — detected stack, installed services, SDD status.

```bash
harness info
```

## Programmatic API

```typescript
import { defineConfig } from "@e-burgos/sdd-harness";

export default defineConfig({
  name: "my-project",
  scope: "@my-org",
  apps: [
    { name: "api", type: "nestjs", port: 3000 },
    { name: "webapp", type: "react", port: 4200 },
  ],
  services: [
    { type: "postgres", port: 5432 },
    { type: "redis", port: 6379 },
  ],
  sdd: {
    enabled: true,
    cycles: [{ cycle: 1, modules: ["auth", "users"] }],
  },
  infra: { provider: "digitalocean" },
});
```

## What is SDD?

**Spec-Driven Development** is a methodology where AI agents follow a structured pipeline to implement features:

1. **Orchestrator** — reads the spec and prepares context
2. **Functional** — converts business goals into user stories
3. **Planner** — breaks stories into ordered technical tasks
4. **Architect** — defines DB schema and API contracts
5. **Implementor (Back)** — implements the backend (NestJS/Prisma)
6. **Implementor (Front)** — implements the frontend (React)
7. **Reviewer** — validates quality and closes the cycle

The harness configures your workspace so AI coding agents can operate autonomously within this pipeline.

## Requirements

- Node.js >= 18
- pnpm >= 9

## Tech Stack Generated

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Frontend | React 19, Vite, Zustand, TanStack Query |
| Backend  | NestJS v10, Prisma v5, PostgreSQL 16    |
| Device   | Python 3.11 (optional)                  |
| Infra    | Docker Compose, DigitalOcean/AWS/GCP    |
| Monorepo | Nx, pnpm workspaces                     |

## License

MIT © [e-burgos](https://github.com/e-burgos)
