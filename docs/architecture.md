# Architecture

FlowTask AI is a small monorepo with two independently deployable applications:

```
Browser (React + Vite + Tailwind + GSAP)
        |  fetch /api/*  (dev: Vite proxy -> :3000)
        v
Express API (Node.js, ES modules)
   |            |
   v            v
MongoDB       Groq API  (server-side only, via the provider layer)
```

## Backend layout

```
server/src/
  config/          env.js (validation + defaults), database.js (connect/disconnect/status)
  middlewares/     error.middleware.js, not-found.middleware.js, validate.middleware.js
  modules/
    tasks/         model, routes, controller, service, validation, constants
    ai/            routes, controller, service, validation, providers/groq.provider.js
  utils/           AppError.js, asyncHandler.js
  app.js           Express wiring (CORS, JSON limits, routes, 404, error handler)
  server.js        startup, graceful shutdown, signal handling
```

### Why these boundaries exist

| Layer | Responsibility | Beginner note |
| --- | --- | --- |
| `routes` | URL + HTTP verb mapping | Declares *what* endpoints exist |
| `validation` | Reject bad input, strip unknown fields | Protects the database from junk |
| `controller` | Translate HTTP <-> service calls | No business logic, only status codes |
| `service` | Business rules and database access | Easy to test without Express |
| `provider` | Talks to Groq | Swap providers without touching anything else |

A request therefore travels: **route -> validation -> controller -> service -> Mongoose -> MongoDB**,
and errors travel back through `asyncHandler` into the single `errorMiddleware`.

## Frontend layout

```
client/src/
  app/            App.jsx, router.jsx, providers/ (theme, toasts)
  components/
    ui/           Button, Input/Textarea/Select, Card, Badge, Modal, Spinner, EmptyState
    shared/       AppSidebar (+ mobile tab bar), AppHeader, StatCard
  features/
    tasks/        api/, components/, hooks/, schemas/, utils/
    ai-planner/   api/, components/, hooks/, utils/
  hooks/          useReducedMotion
  layouts/        AppLayout (sidebar + header + <Outlet/>)
  lib/            navigation metadata
  pages/          DashboardPage, TasksPage, AiPlannerPage, NotFoundPage
  services/       apiClient.js (single fetch wrapper + ApiError)
  styles/         index.css (Tailwind v4 entry + design tokens)
  utils/          cn(), date helpers
```

The project is organised **by feature, not by file type**: everything needed to add a task lives
under `features/tasks`. Only genuinely shared UI lives in `components/`.

## Key design decisions

1. **No global state library.** Each page loads what it needs with a focused hook
   (`useTasks`, `usePlanTask`). The API response is the source of truth; mutations update local
   state with the server's returned object. This is enough for one user and avoids over-engineering.
2. **Server-side validation is authoritative.** Client validation only improves feedback speed.
3. **Allow-listed updates.** `task.validation.js` rejects unknown fields and builds an explicit
   `$set`, which prevents mass assignment (e.g. sending `_id` or `createdAt`).
4. **AI output is untrusted input.** `validateGeneratedPlan()` enforces the contract
   (summary string, priority enum, positive number, 3-7 non-empty steps) before anything is returned.
5. **Provider abstraction.** `ai.service.js` depends on a `{ generateTaskPlan }` interface, so tests
   inject a fake provider and a future provider is a new file, not a rewrite.
6. **Errors are typed.** `AppError(message, statusCode)` distinguishes expected client errors from
   unexpected crashes; production responses never include stack traces.
7. **Tailwind v4 via `@tailwindcss/vite`.** No `tailwind.config.js` or PostCSS file is needed.
   Semantic tokens (`bg-surface`, `text-fg-muted`, `border-border-base`) are CSS variables mapped
   into Tailwind's theme, so light/dark switching is one class on `<html>`.
8. **Animations enhance, never block.** GSAP runs inside `useGSAP` (auto cleanup), only translates
   and fades, and is skipped when `prefers-reduced-motion` is set.

## Request lifecycle examples

**Create task**

```
POST /api/tasks
 -> express.json (100kb limit)
 -> cors
 -> validateCreateTask (title required, allowed fields, status enum, date parsing)
 -> createTaskHandler -> taskService.createTask -> Task.create
 -> 201 { success: true, task }
```

**AI plan**

```
POST /api/ai/plan-task
 -> validatePlanTaskRequest (5..2000 chars, no unknown fields)
 -> aiController -> aiService.planTaskFromDescription
 -> groqProvider.generateTaskPlan (timeout 15s, max 1 retry on transient errors)
 -> validateGeneratedPlan (strict contract)
 -> 200 { success: true, plan }
```

## Configuration and startup

`config/env.js` loads `server/.env` then the root `.env`, validates `PORT`, and exposes
`getEnv(overrides)` for tests. `validateStartupEnv()` refuses to boot in production without
`MONGODB_URI`. `server.js` connects to MongoDB before listening and shuts down gracefully on
`SIGINT`/`SIGTERM`.

For zero-config local development, if MongoDB is unreachable and `NODE_ENV !== 'production'`,
`config/database.js` starts an in-memory MongoDB (`mongodb-memory-server`) and logs that fallback.
Set `ALLOW_MEMORY_DB_FALLBACK=false` to disable it, or provide a real `MONGODB_URI` to use Atlas.
