# FlowTask AI - Full-Stack AI Task Manager

[![CI](https://github.com/Mubashir-Ahmed27/AI-Task-Manager/actions/workflows/ci.yml/badge.svg)](https://github.com/Mubashir-Ahmed27/AI-Task-Manager/actions/workflows/ci.yml)

A production-minded task manager with a polished React dashboard and an AI planner that turns a
free-text goal into a structured, validated action plan.

- **Backend:** Node.js + Express + Mongoose + MongoDB, Groq for planning
- **Frontend:** React 19 + Vite + Tailwind CSS v4 + GSAP + React Router + Lucide icons
- **Quality:** 27 backend tests (unit + HTTP integration), 33 frontend tests, ESLint, production build,
  Postman collection

> AI plans are generated suggestions, not guarantees. Always review them before committing.

---

## 1. Features

**Task management**

- Create, read, update, delete tasks (title, description, status, due date, timestamps)
- Server-side validation, allow-listed fields, centralised errors, 400/404/429/500 semantics
- Search, status filtering, and sorting that actually query/reorder real data
- Delete always requires confirmation before anything is removed

**Dashboard**

- Total / pending / in-progress / completed counts derived from real records
- Completion rate, overdue count, five most recent tasks, nearest due dates
- Quick actions to create a task or open the AI planner

**AI planner**

- Describe a goal -> backend calls Groq -> response is parsed, validated, then returned
- Plan card with summary, priority badge, effort estimate, 3-7 step checklist
- Temporary checklist state (clearly labelled as not persisted), copy plan, save plan as a task
- Friendly errors for missing configuration, rate limits, timeouts, and invalid model output

**Experience**

- Dark-first design with an optional light theme (persisted in `localStorage`)
- Responsive: sidebar on desktop, bottom tab bar on mobile
- Loading skeletons, empty states, inline validation, toast notifications
- GSAP animations scoped with `useGSAP`, cleaned up automatically, skipped for reduced motion
- Visible keyboard focus styles and semantic landmarks throughout

---

## 2. Technology stack

| Area | Choice | Why |
| --- | --- | --- |
| Frontend | React 19, Vite 6 | Fast dev server, simple build, ES modules |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | Official v4 integration; no PostCSS/config files needed |
| Motion | GSAP + `@gsap/react` | One composable plugin handles cleanup for us |
| Routing | React Router 7 | Nested layout routes + SPA fallback |
| Icons | Lucide React | Consistent, tree-shakeable SVGs |
| Backend | Express 4, Mongoose 8 | Small, well-documented, easy to reason about |
| Database | MongoDB (Atlas or local) | Document model fits tasks; Mongoose adds schema validation |
| AI | Groq SDK (`groq-sdk`) | Fast inference, JSON object mode, OpenAI-compatible API |
| Tests | Node built-in test runner + Supertest, Vitest + Testing Library | Zero extra runners on the server; jsdom for UI |

---

## 3. Architecture and folder structure

```
ai-task-manager/
├── client/                     # React SPA
│   ├── public/favicon.svg
│   ├── src/
│   │   ├── app/                # App.jsx, router.jsx, providers/ (theme, toasts)
│   │   ├── components/
│   │   │   ├── ui/             # Button, Input, Card, Badge, Modal, Spinner, EmptyState
│   │   │   └── shared/         # AppSidebar + mobile tab bar, AppHeader, StatCard
│   │   ├── features/
│   │   │   ├── tasks/          # api/, components/, hooks/, schemas/, utils/
│   │   │   └── ai-planner/     # api/, components/, hooks/, utils/
│   │   ├── hooks/              # useReducedMotion
│   │   ├── layouts/            # AppLayout
│   │   ├── lib/                # navigation metadata
│   │   ├── pages/              # Dashboard, Tasks, AiPlanner, NotFound
│   │   ├── services/           # apiClient.js (single fetch wrapper)
│   │   ├── styles/             # index.css (Tailwind + design tokens)
│   │   ├── utils/              # cn(), date helpers
│   │   └── test/setup.js
│   ├── index.html
│   ├── vite.config.js          # React + Tailwind plugins, /api dev proxy, Vitest config
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/             # env.js, database.js
│   │   ├── middlewares/        # error, not-found, validate
│   │   ├── modules/
│   │   │   ├── tasks/          # model, routes, controller, service, validation, constants
│   │   │   └── ai/             # routes, controller, service, validation, providers/groq.provider.js
│   │   ├── utils/              # AppError, asyncHandler
│   │   ├── app.js              # Express wiring
│   │   └── server.js           # startup + graceful shutdown
│   ├── tests/
│   │   ├── unit/               # task validation, AI validation, provider retry logic
│   │   └── integration/        # Supertest HTTP tests against an in-memory MongoDB
│   └── package.json
├── postman/
│   ├── ai-task-manager.collection.json
│   └── environment.example.json
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── deployment.md
├── .env.example
├── .gitignore
└── package.json                # root scripts (dev, test, build, install:all)
```

**Request flow:** route -> validation middleware -> thin controller -> service -> Mongoose.
Every rejection ends in one error middleware that normalises the response shape.
**Frontend flow:** page -> feature hook (`useTasks`, `usePlanTask`) -> `services/apiClient.js` ->
feature API module -> JSON response. No component calls `fetch` directly.

More detail: [`docs/architecture.md`](docs/architecture.md).

---

## 4. Prerequisites

- Node.js **22 LTS** (recommended; `engines` is pinned to `22.x` so hosts like Vercel/Render pick a stable major)
- npm 10+
- A MongoDB connection string (Atlas free tier is fine) - optional for a first run, see below
- A Groq API key for the AI planner (https://console.groq.com/keys)
- Windows PowerShell 7+, macOS, or Linux

---

## 5. Installation

From the repository root:

```bash
npm run install:all
```

That runs `npm install` at the root (dev runner), then in `server/`, then in `client/`.

Equivalent manual steps:

```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

---

## 6. Environment configuration

Copy the example file and edit it:

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
notepad .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

```dotenv
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/ai-task-manager
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
CLIENT_ORIGIN=http://localhost:5173
```

| Variable | Where | Required | Notes |
| --- | --- | --- | --- |
| `PORT` | server | no (3000) | Backend port |
| `NODE_ENV` | server | no | `production` requires `MONGODB_URI` |
| `MONGODB_URI` | server | production yes | Atlas or local MongoDB URI |
| `GROQ_API_KEY` | **server only** | for AI | Never put this in the browser |
| `GROQ_MODEL` | server | no | Defaults to `llama-3.3-70b-versatile` |
| `CLIENT_ORIGIN` | server | no | Comma-separated allowed CORS origins |
| `AI_TIMEOUT_MS` | server | no | Default 15000 |
| `VITE_API_URL` | client | no | Empty in dev (Vite proxy); set to backend URL in production |

Where the server looks for env files: `server/.env` first, then the repo-root `.env`. Both are
git-ignored; only `.env.example` files are committed. Everything prefixed with `VITE_` ends up in
the public JS bundle - never store secrets there.

### Zero-config database fallback

If `MONGODB_URI` is unset or unreachable **and** `NODE_ENV` is not `production`, the server starts an
in-memory MongoDB (`mongodb-memory-server`) so you can explore the app immediately. Data disappears
when the process stops. For persistent data, point `MONGODB_URI` at Atlas or a local MongoDB.
Disable the fallback with `ALLOW_MEMORY_DB_FALLBACK=false`.

---

## 7. MongoDB Atlas setup

1. Create a free cluster at https://cloud.mongodb.com.
2. **Database Access** -> **Add New Database User** (keep the password somewhere safe).
3. **Network Access** -> **Add IP Address**. For local development add your current IP; for a hosted
   backend add that host's egress IPs (or `0.0.0.0/0` while learning).
4. **Connect** -> **Drivers** -> copy the `mongodb+srv://...` string.
5. Replace `<username>`/`<password>` and append a database name, e.g. `/ai-task-manager`.
6. Paste it into `MONGODB_URI`, restart the server, and check `GET /api/health`:
   `"database": "connected"`.

---

## 8. Groq API setup

1. Sign in at https://console.groq.com, open **API Keys**, create a key starting with `gsk_`.
2. Put it in `.env` as `GROQ_API_KEY=...` (server-side only).
3. Set `GROQ_MODEL` to a currently listed production model. At the time of writing the docs list
   `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `openai/gpt-oss-20b`, and
   `openai/gpt-oss-120b`. Confirm on https://console.groq.com/docs/models.
4. Restart the server. `GET /api/health` should report `"aiPlanner": "configured"`.
5. Test it:

```powershell
curl.exe -X POST http://localhost:3000/api/ai/plan-task `
  -H "Content-Type: application/json" `
  -d '{"description":"I need to build a portfolio website within three days."}'
```

The provider module requests `response_format: { type: 'json_object' }`, validates the parsed JSON,
retries **once** on transient 5xx/timeout errors, and never retries 4xx errors.

---

## 9. Running the application

From the repository root:

```bash
npm run dev
```

This starts both processes with `concurrently`:

- API: http://localhost:3000
- UI: http://localhost:5173

Individually:

```bash
npm run dev:server   # node --watch src/server.js inside server/
npm run dev:client   # vite inside client/
```

Production-style:

```bash
npm run build        # builds client/dist
npm start            # starts the Express server
```

### Local API routing

In development the frontend calls relative `/api/...` URLs and Vite proxies them to
`http://localhost:3000` (`client/vite.config.js`). That means no CORS friction and no env file
needed. If you prefer explicit URLs, set `VITE_API_URL=http://localhost:3000` in `client/.env` and
keep `CLIENT_ORIGIN=http://localhost:5173` on the server.

---

## 10. API endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Status, DB state, whether AI is configured |
| GET | `/api/tasks` | List tasks (`status`, `search`, `sort`) |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get one task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST | `/api/ai/plan-task` | Generate a validated AI plan |

Full request/response examples: [`docs/api.md`](docs/api.md).

---

## 11. Testing

```bash
npm run test:server   # Node test runner + Supertest (in-memory MongoDB, AI mocked)
npm run test:client   # Vitest + Testing Library
npm run lint          # ESLint (client) + syntax check (server)
npm run build         # production frontend build
npm run ci            # everything the CI workflow runs, in order: lint -> test -> build
```

`npm run ci` mirrors `.github/workflows/ci.yml` locally, so you can catch a failure before pushing.

The backend suite needs no API key: the AI provider is injected with a fake, and the database is an
in-memory MongoDB instance created per test file. No production database is ever touched.

What the tests cover:

- Task validation: trimming, required title, invalid status, unknown fields, empty updates,
  malformed ObjectIds
- Full CRUD over HTTP: create/list/get/update/delete, filtering, searching, 400/404 paths,
  malformed JSON bodies
- AI contract: valid plan parsing, invalid JSON, wrong priority, wrong step count, negative hours,
  bounded retry on 5xx, provider error normalisation (401/429/timeout), missing credentials
- Frontend: API client error parsing, task filtering/sorting/stats, plan formatting, TaskCard
  interactions

---

## 12. Continuous integration

The workflow is versioned at [`docs/ci/github-actions-ci.yml`](docs/ci/github-actions-ci.yml). It is
**not yet active** because the automation token used for this repository cannot create files under
`.github/workflows/` (GitHub requires the special `workflows` permission for that path). Activate it
with either option below — it takes about a minute:

**Option A — GitHub web UI (no extra tooling)**

1. Open the repository → **Add file → Create new file**.
2. Name it `.github/workflows/ci.yml`.
3. Paste the contents of `docs/ci/github-actions-ci.yml`, then **Commit changes**.

**Option B — local clone with a personal token**

```powershell
mkdir .github/workflows
Copy-Item docs/ci/github-actions-ci.yml .github/workflows/ci.yml
git add .github/workflows/ci.yml
git commit -m "ci: activate GitHub Actions workflow"
git push
```

Once active it runs on every push to `main`, every pull request targeting `main`, and on demand
(`workflow_dispatch`):

| Job | Steps |
| --- | --- |
| `server` | `npm ci` → `npm run lint` → `npm test` (27 tests, in-memory MongoDB, cached binary) |
| `client` | `npm ci` → `npm run lint` → `npm test` (33 tests) → `npm run build` → uploads `client-dist` |

Notes:

- Both jobs use Node.js 22 and npm caching keyed on the respective `package-lock.json`.
- The MongoDB binary used by `mongodb-memory-server` is cached across runs, keyed on
  `server/package-lock.json`, so integration tests do not re-download ~80 MB every time.
- No repository secrets are required: the server tests mock the AI provider, so CI passes without
  `GROQ_API_KEY` or a real database.
- The workflow file was verified to be valid YAML locally, and every command it runs passes locally
  (`npm test`, `npm run lint`, `npm run build`), but the first GitHub-hosted run will only happen
  after the file is added under `.github/workflows/`.
- `npm run ci` at the repository root runs the same sequence locally (lint → tests → build).
- To require green CI before merging, enable branch protection on `main`:
  **Settings → Branches → Add branch protection rule → Require status checks to pass**, then select
  `Server (lint + API tests)` and `Client (lint + tests + build)`.

---

## 13. Postman

1. Open Postman -> **Import** -> `postman/ai-task-manager.collection.json`.
2. Import `postman/environment.example.json` and select it (or just use the collection variables).
3. Start the server, then run the **Tasks** folder top to bottom - `Create Task` saves the new
   `taskId` into a collection variable that the following requests reuse.
4. The **AI Planner** request passes when the plan is generated (200) *or* when the API correctly
   reports 429/502/503/504, so it is safe to run without a Groq key.

Requests included: health, create, list, get by ID, update, delete, AI plan, missing title, invalid
status, unexpected field, invalid ID, nonexistent task, missing AI description.

---

## 14. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Cannot reach the server` in the UI | API not running on :3000 | `npm run dev` (or `npm run dev:server`) |
| `MongoDB connection failed` in logs | wrong URI / IP not allow-listed | check `MONGODB_URI`, add your IP in Atlas |
| `services.database: disconnected` | server started before Mongo connected | restart the server, check the startup log |
| `AI planner is not configured` (503) | `GROQ_API_KEY` missing | add the key, restart the server |
| `AI provider rate limit reached` (429) | Groq throttling | wait a few seconds and retry |
| `Configured AI model is unavailable` (502) | model retired/typo | set `GROQ_MODEL` to a model listed in Groq docs |
| CORS error in the browser | origin mismatch | set `CLIENT_ORIGIN` to the exact frontend origin |
| `EADDRINUSE :3000` | port already in use | stop the other process or change `PORT` |
| PowerShell blocks `npm` | execution policy | run `Set-ExecutionPolicy -Scope Process RemoteSigned` |
| Vercel: `engines node will automatically upgrade` | `engines` used a `>=` range | already fixed: `engines.node` is pinned to `22.x` in all packages |
| Vercel: `npm warn Unknown env config "cache-dir"` | build image sets `npm_config_cache_dir`; npm 10 warns | harmless; use npm 11+ or set `NPM_CONFIG_CACHE` instead (see `docs/deployment.md` §5b) |
| Vercel: deep links 404 | no SPA rewrite | `vercel.json` at the repo root already rewrites `/(.*)` to `/index.html` |
| UI shows `405` / "reached the static site host" | the browser is calling the Vercel domain, not the API (`VITE_API_URL` unset or pointing at the frontend) | set `VITE_API_URL` to the backend URL in Vercel, then **redeploy** (Vite bakes it at build time). See `docs/deployment.md` §7 |
| Tailwind classes do nothing | wrong Tailwind setup | this project uses v4 via `@tailwindcss/vite`; do not add a v3 `tailwind.config.js` |

Logs to check: server terminal (startup, database, provider errors) and the browser dev console.

---

## 15. Deployment

Step-by-step instructions for Render (backend web service) and Vercel (frontend static site), plus
env vars, Atlas network access, CORS, SPA rewrites and verification commands:
[`docs/deployment.md`](docs/deployment.md).

Quick summary:

- **Frontend (Vercel):** the repository root contains `vercel.json`, so deploying the repo root
  builds `client/` and serves `client/dist` with an SPA rewrite. Set `VITE_API_URL` to the backend
  URL in the Vercel project.
- **Backend (Render):** root dir `server`, build `npm install`, start `npm start`, health check
  `/api/health`; set `MONGODB_URI`, `GROQ_API_KEY`, `GROQ_MODEL`, `CLIENT_ORIGIN`,
  `NODE_ENV=production`.
- `engines.node` is pinned to `22.x` in all three `package.json` files so hosting platforms select a
  stable major instead of auto-upgrading to the next Node release.

---

## 16. Security notes

- Secrets live only in server environment variables; `.env` files are git-ignored.
- Vite variables are public by definition - no AI keys ever reach the browser.
- All request bodies are validated and unknown fields rejected (mass-assignment protection).
- JSON payloads are capped at 100 kB; malformed JSON yields a clean 400.
- AI output is treated as untrusted: parsed, contract-checked, and never executed.
- Error responses never include stack traces, database internals, or provider secrets.
- CORS is an allow-list in production; requests without an `Origin` header are permitted for
  tooling.
- There is intentionally **no authentication**: this is a single-user learning project. Add auth
  before exposing real user data.

---

## 17. Verification status

Confirmed by running the commands locally:

| Check | Command | Result |
| --- | --- | --- |
| Backend unit + integration tests | `npm --prefix server test` | **27 passing**, 0 failing |
| Frontend unit/component tests | `npm --prefix client test` | **33 passing**, 0 failing |
| ESLint | `npm --prefix client run lint` | clean (0 errors, 0 warnings) |
| Production build | `npm --prefix client run build` | succeeds (~396 kB JS / 40 kB CSS, gzip ~129 kB / 7.6 kB) |
| Server boot + CRUD over HTTP | `node src/server.js` + curl | health, create, list, update, delete verified |
| Postman collection | `newman run postman/ai-task-manager.collection.json` | 13 requests, 28 assertions, 0 failures |
| Vite `/api` dev proxy | `curl http://localhost:5173/api/health` | proxied correctly |
| CI workflow definition | `docs/ci/github-actions-ci.yml` | valid YAML, runs the same commands verified locally; **not yet active** (token lacks the `workflows` permission — activation steps in §12) |
| Local CI mirror | `npm run ci` | lint → 27/27 server tests → 33/33 client tests → production build, all pass |
| Vercel frontend config | `vercel.json` + `npm --prefix client run build` | config validated (JSON + local build of exactly that command); no live Vercel deploy performed |

Not verified here (no credentials / environment limits):

- A real Groq generation (no `GROQ_API_KEY` available). The endpoint correctly returns 503 with a
  safe message, and provider behaviour is covered by mocked unit/integration tests. To verify:
  add your key, restart, and POST to `/api/ai/plan-task`.
- MongoDB Atlas connectivity (tests use in-memory MongoDB; local runs used the built-in fallback).
- Real deployment on Render.
- Full browser automation (Chromium could not launch in this sandbox due to missing system
  libraries). The UI is covered by jsdom component tests plus manual API verification.

## 18. Next recommended improvement

Add authentication (JWT or session-based) and scope every task to a `ownerId`, then add pagination
once a user can have hundreds of tasks. After that, a natural follow-up is persisting AI plan steps
as sub-tasks so the checklist in the planner becomes durable data instead of temporary UI state.
