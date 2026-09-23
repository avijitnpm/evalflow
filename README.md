# EvalFlow

**Open-source LLM observability and evaluation — trace, monitor, and improve your AI applications.**

EvalFlow is a self-hostable observability platform for LLM applications, built on the proven Langfuse engine. It captures every trace, generation, and score from your AI stack and turns them into searchable insights, dashboards, and automated evaluations — so you can ship reliable AI faster.

---

## Overview

```
AI Application → EvalFlow SDK / API / AI Skill → EvalFlow API → PostgreSQL + ClickHouse + Redis + S3 → Worker → Web UI
```

**Typical workflow:**

1. **Instrument** — add tracing with the EvalFlow AI skill or SDK (one prompt to your coding agent)
2. **Observe** — traces, sessions, latency, cost, and errors appear in seconds
3. **Group** — sessions correlate multi-turn conversations
4. **Evaluate** — scores and evaluators quantify quality and safety
5. **Iterate** — prompts are versioned and tested before deployment
6. **Monitor** — dashboards and alerts surface regressions automatically

EvalFlow keeps your data in your infrastructure. PostgreSQL stores the control plane, ClickHouse powers analytics, and the worker processes ingestion asynchronously.

## Features

### Observability
- **Traces & Observations** — hierarchical trace → span → generation tree with input/output, latency, token counts, cost, level, and metadata
- **Generations** — LLM calls with model, usage, and cost breakdown
- **Sessions** — `sessionId` groups related traces (conversations, threads)
- **Latency & Performance** — p50/p95/p99 by trace, observation, model, and user; time-to-first-token, tokens/sec
- **Token & Cost Tracking** — per-model pricing, total cost, input/output breakdown (powered by ClickHouse)
- **Errors & Levels** — `DEFAULT`/`WARNING`/`ERROR` with full-text search on input/output
- **Metadata & Tags** — flexible key/value filtering, environment separation, user attribution

### Evaluation
- **Scores** — numeric, categorical, and boolean scores attached to traces/observations/sessions
- **Evaluators** — LLM-as-a-judge, code evaluators (Python/TypeScript), and human annotation queues
- **Datasets & Experiments** — versioned datasets, run experiments, compare outputs before deployment
- **Evaluation Rules** — automate scoring on ingestion

### Prompt Management
- Centrally manage prompts, version control, and A/B test variants
- Prompts decoupled from code — deploy without redeploying the app
- SDK fetches production label with client-side caching; UI + API editing
- Protected labels and diff view

### Dashboards
Curated EvalFlow dashboards (read-only, cloneable) plus custom builder:
- **EvalFlow Home** — overview of traces, costs, scores, usage, latencies
- **EvalFlow Latency Dashboard** — latency by use-case, model, environment
- **EvalFlow Cost Dashboard** — cost by model, environment, user
- **EvalFlow Usage Management** — trace/observation/score counts by env
- **EvalFlow Agent Dashboard** — tool calls, top tools, tool errors/latency
- Import/export widgets as JSON; preset cards reuse Home queries

### Alerts & Monitoring
- **Monitors / Alerts** — notify on cost spikes, latency changes, score drops, error rates
- Built on the dashboard query engine (`@langfuse/shared/query`) with filterable triggers
- Delivery via webhook, Slack, and in-app

### Organizations & Access Control
- **Organizations → Projects → API Keys** (org/project API keys, LLM connections)
- **RBAC** — `MEMBER`/`ADMIN`/`OWNER`/`VIEWER` per organization/project with scoped permissions (`projects:create`, `alerts:read`, `prompts:read`, `datasets:read`, etc.)
- **Entitlements** — `cloud-billing`, `audit-logs`, `admin-api`, etc. (self-host defaults to OSS)
- **Data retention**, **audit logs**, **verified domains** (enterprise)

### AI Coding / Agent Integrations
Tracing is added by asking your coding agent to follow EvalFlow best practices — no manual SDK wiring required:

| Agent | Mechanism |
|---|---|
| **Claude Code** | `github.com/avijitnpm/skills` — EvalFlow AI skill; paste prompt from **Tracing → Add tracing with your coding agent** |
| **Codex** | Same skill via `.codex/config.toml` MCP (`langfuse-docs` + `playwright`) |
| **OpenCode / Cursor / Copilot** | Same skill (agent-agnostic prompt); works wherever an AI coding agent can edit code |

The skill instructs the agent to install the correct SDK (`langfuse`, `langfuse-core`), initialize `Langfuse`/`observe` wrappers, and add `sessionId`/`userId` where appropriate. Traces appear at `http://localhost:3000/project/{id}/traces`.

## Architecture

```mermaid
flowchart TD
  App[AI Application\nLLM calls] --> |SDK / OTEL / API| Ingest[EvalFlow Ingestion API\nweb/src/pages/api/public/*]
  Skill[Claude / Codex / OpenCode\ngithub.com/avijitnpm/skills] -.-> App
  Ingest --> Queue[Redis + BullMQ]
  Queue --> Worker[Worker\nworker/src/queues/*]
  Worker --> PG[(PostgreSQL)]
  Worker --> CH[(ClickHouse)]
  Worker --> S3[(MinIO / S3)]
  PG <--> Web[Next.js Web\nweb/src]
  CH <--> Web
  S3 <--> Web
  Redis <--> Web
  Web --> UI[Web UI\nDashboards / Traces / Prompts / Alerts]
```

**Components**
- **Web** (`web/`) — Next.js 16 with Pages Router, tRPC, Prisma, NextAuth; serves UI, public REST, and OTEL ingestion
- **Worker** (`worker/`) — Express + BullMQ processors; batch ClickHouse writes, evaluations, retention, blob exports, monitors
- **PostgreSQL 17** — control plane (organizations, projects, prompts, scores, dashboards metadata)
- **ClickHouse** — analytics store (traces, observations, scores, events) with materialized views
- **Redis 7** — queues + cache (BullMQ, noeviction)
- **MinIO / S3** — event and media object storage (`langfuse` bucket, `events/` + `media/` prefixes)
- **Auth** — NextAuth with email/password, OAuth (Google, GitHub, Azure AD, Okta, etc.), enterprise SSO
- **Shared** (`packages/shared/`) — Prisma schema, ClickHouse migrations (canonical templates), queue contracts (`src/server/queues.ts`), domain models, repositories

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript 7, Tailwind CSS, Radix UI, Recharts, tRPC, Zustand |
| Backend | Node.js 24, Express (worker), Next.js API routes, tRPC, Prisma 6 |
| Database (control) | PostgreSQL 17 |
| Database (analytics) | ClickHouse 25.12 / 1.1 (server) |
| Queue / Cache | Redis 7, BullMQ 5 |
| Object Storage | MinIO (local), S3-compatible (AWS, GCS, Azure) |
| Auth | NextAuth.js, Prisma Adapter |
| Observability | OpenTelemetry, PostHog, Sentry |
| AI Skills | `@repo/langfuse-skills`, `.claude/skills`, `.codex/config.toml` |
| Containerization | Docker, Docker Compose |
| Package Manager | pnpm 12.4.1 (enforced) |

## Getting Started

### Requirements
- Git, Docker + Docker Compose, Node.js 24, pnpm 12.4.1

### 1. Clone
```bash
git clone https://github.com/avijitnpm/evalflow.git
cd evalflow
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Environment
Copy the dev template (already has ClickHouse, Postgres, Redis, MinIO, auth, and AI feature defaults):

```bash
cp .env.dev.example .env
# then edit .env if needed
```

Key variables (`web/src/env.mjs` / `.env.dev.example`):

| Category | Variable | Default (dev) |
|---|---|---|
| DB | `DATABASE_URL`, `DIRECT_URL` | `postgresql://postgres:postgres@localhost:5432/postgres` |
| ClickHouse | `CLICKHOUSE_URL`, `CLICKHOUSE_MIGRATION_URL`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD` | `http://localhost:8123` / `clickhouse://localhost:9000` |
| Redis | `REDIS_HOST`, `REDIS_PORT`, `REDIS_AUTH` | `127.0.0.1:6379` / `myredissecret` |
| Auth | `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `SALT`, `ENCRYPTION_KEY` | `http://localhost:3000` / `secret` |
| S3 | `LANGFUSE_S3_*_BUCKET/ENDPOINT/ACCESS_KEY_ID` | `langfuse` / `http://localhost:9090` / `minio` |
| App | `NEXT_PUBLIC_LANGFUSE_CLOUD_REGION` | `DEV` |
| Seeding | `LANGFUSE_INIT_*` (org/project/user) | optional |

Do not commit secrets. `ENCRYPTION_KEY` → `openssl rand -hex 32`.

### 4. Start infrastructure
```bash
# dev infra (postgres, redis, clickhouse, minio) with healthchecks
pnpm run infra:dev:up
# or: docker compose -f docker-compose.dev.yml up -d --wait
```

Ports: `5432` Postgres, `6379` Redis, `8123`/`9000` ClickHouse, `9090`/`9091` MinIO, `3000` Web, `3030` Worker.

### 5. Start the application (development)
```bash
# migrates + seeds + runs web + worker
pnpm run dev
# or separately:
pnpm run dev:web     # Next.js at http://localhost:3000
pnpm run dev:worker  # BullMQ worker at http://localhost:3030/api/health
```

First run alternative (nuke + seed examples):
```bash
pnpm run dx
```

### 6. Access the UI
Open `http://localhost:3000` → create organization → create project → copy API keys from **Project Settings → API Keys**.

### 7. Verify
```bash
curl http://localhost:3000/api/public/health
# {"status":"OK","version":"4.41.0"}

docker compose -f docker-compose.dev.yml ps
# postgres, redis, clickhouse, minio all (healthy)
```

## Docker Deployment

EvalFlow ships two compose files:

- `docker-compose.dev.yml` — local dev with source mounts and `DEV` region
- `docker-compose.build.yml` — production-like build from `./web/Dockerfile` / `./worker/Dockerfile`
- `docker-compose.yml` — prebuilt `docker.langfuse.com/langfuse/langfuse:4` images

**Build & run (recommended for demo):**
```bash
cp .env.dev.example .env
docker compose -f docker-compose.build.yml up -d --build
docker compose -f docker-compose.build.yml ps
# clickhouse, postgres, redis, minio, langfuse-web, langfuse-worker all (healthy)
```

**Logs / status / stop:**
```bash
docker compose -f docker-compose.build.yml ps
docker compose -f docker-compose.build.yml logs --tail=100 langfuse-web
docker compose -f docker-compose.build.yml logs --tail=100 langfuse-worker
docker compose -f docker-compose.build.yml stop langfuse-web langfuse-worker clickhouse
# ClickHouse dirty fix (only clickhouse data): docker volume rm langfuse_langfuse_clickhouse_data langfuse_langfuse_clickhouse_logs
```

Health: `http://localhost:3000/api/public/health` (web) and `http://localhost:3030/api/health` (worker).

## Configuration

All env vars are validated in `web/src/env.mjs` and `packages/shared/src/env.ts`. Important groups:

- **Database:** `DATABASE_URL`, `DIRECT_URL` (Prisma), `POSTGRES_*` (compose)
- **ClickHouse:** `CLICKHOUSE_URL`, `CLICKHOUSE_MIGRATION_URL`, `CLICKHOUSE_USER/PASSWORD`, `CLICKHOUSE_CLUSTER_ENABLED`
- **Redis:** `REDIS_HOST/PORT/AUTH`, `REDIS_TLS_*` (optional)
- **Object Storage:** `LANGFUSE_S3_EVENT_UPLOAD_*`, `LANGFUSE_S3_MEDIA_UPLOAD_*`, `LANGFUSE_S3_BATCH_EXPORT_*`
- **Auth:** `NEXTAUTH_SECRET/URL`, `SALT`, `ENCRYPTION_KEY`, OAuth providers, `LANGFUSE_INIT_*` (first org/project/user)
- **App URLs:** `NEXTAUTH_URL`, `HOSTNAME`, `LANGFUSE_MCP_BASE_URL`
- **AI Features:** `LANGFUSE_AI_PROVIDER` (`bedrock|anthropic|openai|vertex`), `LANGFUSE_AI_MODEL`, `LANGFUSE_AI_API_KEY`, `LANGFUSE_IN_APP_AGENT_ENABLED`
- **Tracing:** `LANGFUSE_JSON_BAD_UNICODE_ESCAPE`, `LANGFUSE_OTEL_MEDIA_UPLOAD_ENABLED`
- **V4 Migration:** `LANGFUSE_MIGRATION_V4_WRITE_MODE` (`legacy|dual|events_only`), `LANGFUSE_MIGRATION_V4_ALLOW_PREVIEW_OPT_IN`

See `.env.dev.example` (362 lines), `.env.prod.example`, `docker-compose.*.yml` for full defaults.

## Tracing an AI Application

**Option A — AI Skill (recommended, zero manual wiring):**
1. Create API keys: **Project Settings → API Keys → Create**
2. In your app repo, ask your agent:
   > `Install the EvalFlow AI skill from github.com/avijitnpm/skills and use it to add tracing to this application with EvalFlow following best practices.`
3. Run your app — traces appear in **Tracing** within seconds.

**Option B — SDK (any LLM framework):**
```bash
npm install langfuse
```
```ts
import { Langfuse } from "langfuse";
const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST ?? "http://localhost:3000",
});
const trace = langfuse.trace({ name: "chat", userId: "user-123", sessionId: "sess-abc" });
const span = trace.span({ name: "retrieval" });
const generation = span.generation({ name: "llm-call", model: "gpt-4o", input: prompt });
generation.end({ output });
await langfuse.flushAsync();
```

OTEL and `POST /api/public/ingestion` / `/api/public/otel/v1/traces` are also supported (see `web/src/pages/api/public/ingestion.ts`).

## Claude Code Integration

1. Ensure `github.com/avijitnpm/skills` is accessible.
2. From **Tracing → Add tracing with your coding agent**, copy:
   `Install the EvalFlow AI skill from github.com/avijitnpm/skills and use it to add tracing to this application with EvalFlow following best practices.`
3. Paste into Claude Code (or any terminal with `claude` CLI). The skill (via `packages/langfuse-skills` and `.claude/skills`) installs the SDK, wraps LLM calls, and adds `sessionId`/`userId`/`traceId` handling.
4. Required env in your app: `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST=http://localhost:3000`
5. What gets traced: generations, spans, tool calls, scores — visible in **Tracing / Sessions / Scores**.

## OpenCode Integration

Same skill, agent-agnostic. OpenCode reads the skill prompt from the clipboard and applies the same instrumentation. No separate plugin — the skill generates idiomatic code for your stack (LangChain, Vercel AI SDK, OpenAI SDK, etc.) and verifies with `langfuse.flushAsync()`. Configure the same three env vars; traces appear identically.

## Codex Integration

Codex is configured via `.codex/config.toml`:

```toml
[mcp_servers.langfuse-docs]
url = "https://langfuse.com/api/mcp"
```

The skill prompt above works verbatim in Codex (`codex` CLI). Codex MCP also exposes `worker/src/scripts` and `packages/shared` for in-app-agent runs. After instrumentation, run your app and open **Tracing**.

## Evaluations & Scores

- **Scores:** Attach `score` (numeric 0-1, categorical, boolean) to any trace/observation/session via SDK `trace.score({name, value})` or UI.
- **Evaluators:** Create in **Evaluation → Evaluators** (LLM-as-a-judge, code eval) — templates from `web/src/features/evals/` with `scoreConfigs` stored in Postgres, executed by worker queues (`evaluation-execution-queue`).
- **Run:** Scores appear in **Scores** table; evaluation results link back to traces. Use `Scores → Chart` for trends.

## Prompts

**Prompt Management** (`Prompts`) is fully versioned:
- Create prompt → edit variants → label `production`/`latest`
- SDK fetches via `langfuse.getPrompt("my-prompt", {label: "production"})` with client caching
- Protected labels, diff view, metrics per version (latency/cost/scores)

No video onboarding; empty state guides to **Create Prompt**.

## Dashboards

- **Home** (`/project/[projectId]`) — EvalFlow Home (preset cards: Traces, Model Costs, Scores, Traffic, Usage, User Consumption, Latencies)
- **Dashboards** (`/dashboards`) — create custom dashboards, add widgets (filter by `traces`/`observations`/`scores`, chart types `LINE_TIME_SERIES`/`BAR`/`PIE`/`NUMBER`)
- Curated dashboards are `owner: LANGFUSE` (cloneable): **EvalFlow Latency / Cost / Usage / Agent**. Import/export via JSON (`dashboard-import-export.ts`). Worker upserts definitions from `worker/src/constants/langfuse-dashboards.json` and `LANGFUSE_HOME_DASHBOARD`.

## Alerts & Monitoring

**Alerts** (`/project/[projectId]/alerts`) — monitors on top of the query engine:
- Configure in **New Alert** with filters (model, env, score thresholds) and webhook/Slack actions
- `DataTableControlsProvider` + `MonitorsTable` (RBAC `alerts:read`/`alerts:CUD`)
- Scrollable page layout; alerts evaluated by worker `monitor-queue`

## Organizations & RBAC

- **Hierarchy:** User → Organizations → Projects. Create via `/` (Organizations) and `/organization/[id]`.
- **Roles:** `OWNER` (manage org, billing, members), `ADMIN`/`MEMBER` (project CRUD), `VIEWER` (read-only). Checked via `useHasOrganizationAccess` / `useHasProjectAccess`.
- **Projects:** Members, API keys (`organization:CRUD_apiKeys`, `projectMembers:read`), LLM connections, retention, exports.
- **Entitlements:** `admin-api`, `audit-logs`, `cloud-billing`, `data-retention`, `prompt-protected-labels` (self-host defaults to OSS, `NEXT_PUBLIC_LANGFUSE_CLOUD_REGION` gates cloud features).

## API / SDK

- **Public REST:** `web/src/pages/api/public/` — `ingestion`, `otel/v1/traces`, `projects`, `prompts`, `datasets`, `scores`, `experiments`, `mcp` (see `fern/apis/` + `web/public/generated/api/openapi.yml`)
- **Auth:** Project API keys (`pk-lf-*` / `sk-lf-*`, HMAC `SALT`)
- **SDKs:** `langfuse` (Node/JS, Python via `langfuse-python`), `langfuse-core` — compatible with `LANGFUSE_*` env and `x-langfuse-*` headers (preserved)
- **Docs:** `fern/` generates OpenAPI; run `pnpm run openapi:export`

## Project Structure

```
evalflow/  (langfuse fork, branded EvalFlow)
├── web/                 Next.js app (UI, tRPC, REST, OTEL ingest)
│   ├── src/pages/api/public/  ingestion & public APIs
│   ├── src/features/    tracing, sessions, prompts, evals, dashboards, alerts
│   ├── src/components/design-system/  EvalFlow Logo/Icon (LangfuseLogo/Icon internally)
│   └── public/          EvalFlow wordmark/icon/favicon (from replacement-assets/)
├── worker/              BullMQ consumers, ingestion, evaluations
│   ├── src/queues/      30+ queues (ingestion, otel, evaluation, export...)
│   └── src/constants/langfuse-dashboards.json  curated dashboards
├── packages/shared/     Prisma schema, ClickHouse migrations (canonical/), queue contracts, repositories
├── packages/native/     Rust addon (worker)
├── ee/                  Enterprise (billing, SSO – hidden in demo nav)
├── ai-gateway/          LLM gateway (optional)
├── fern/                API definition → generated/
├── docker-compose.build.yml  production-like build (web/worker from Dockerfile)
├── docker-compose.dev.yml    dev infra only
└── scripts/             release, postinstall, openapi, nuke
```

## Development

```bash
pnpm install                    # install (Node 24)
pnpm run dev                    # web + worker (watch)
pnpm run dev:web               # only web (Next dev on :3000)
pnpm run dev:worker             # only worker (tsx watch)
pnpm run lint                   # turbo lint (eslint, max-warnings 0)
pnpm run typecheck              # turbo typecheck
pnpm run build                  # turbo build (db:generate → build)
pnpm run build:check            # check build
pnpm run test                   # turbo test (vitest)
pnpm run db:generate            # prisma generate
pnpm run db:migrate             # dev migrate
pnpm --filter @langfuse/shared run db:seed:examples  # seed example data
pnpm run seed -- list           # list seeder scenarios
pnpm run playwright:install     # chromium for e2e
pnpm run infra:dev:up           # start infra (postgres, redis, clickhouse, minio)
pnpm run storybook              # web storybook :6006
```

## Troubleshooting

- **ClickHouse dirty `Dirty database version 1`:** only clickhouse volume dirty. Preserve postgres/redis/minio and run:
  ```bash
  docker rm -f langfuse-clickhouse-1
  docker volume rm langfuse_langfuse_clickhouse_data langfuse_langfuse_clickhouse_logs
  docker compose -f docker-compose.build.yml up -d clickhouse
  # wait healthy, then
  docker compose -f docker-compose.build.yml up -d langfuse-worker langfuse-web
  ```
  Do not `down -v`.

- **Web exits with ClickHouse unreachable / `CLICKHOUSE_PASSWORD` URL-encoded:** check `.env` `CLICKHOUSE_*` and `docker compose ps` health.

- **Prisma no migration:** `pnpm run db:generate && pnpm --filter @langfuse/shared run db:migrate`

- **Redis auth:** `REDIS_AUTH` must match `redis.conf`; `redis-cli -a myredissecret ping`

- **MinIO bucket missing:** worker creates `langfuse` bucket on `minio:9000`; check `9090` console.

- **Env not loaded:** `turbo.json` depends on `.env`; ensure `.env` exists (`cp .env.dev.example .env`).

- **Port conflict:** override via `POSTGRES_HOST_PORT` etc. in `.env` (see `.env.dev.example` Docker config).

- **Worker not healthy:** check `http://localhost:3030/api/health`; ensure ClickHouse/Postgres/Redis healthy first (worker `depends_on`).

## Contributing

Langfuse's `CONTRIBUTING.md` applies. Please run `pnpm run lint && pnpm run typecheck` and targeted `pnpm --filter web run test` before PR. Keep changes scoped; prefer design-system components. Do not rename `LANGFUSE_*` or `@langfuse/*` technical identifiers. Enterprise code lives in `ee/` (MIT vs EE license – see `LICENSE`).

## License

MIT for OSS files; `ee/`, `web/src/ee/`, `worker/src/ee/` under EE license (see `LICENSE` and `ee/LICENSE`). Copyright 2023-2026 ClickHouse, Inc. — EvalFlow branding is a UI product layer on the Langfuse engine, preserving all SDK/API compatibility.

---

*Built on Langfuse • Branded as EvalFlow. Tracing → Sessions → Scores → Prompts → Dashboards → Alerts.*
