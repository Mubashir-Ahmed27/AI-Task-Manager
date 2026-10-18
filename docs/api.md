# API Reference

Base URL (local): `http://localhost:3000`

All responses are JSON. Successful responses use `success: true`; failures use
`success: false` plus a human-readable `message` (and optional `errors[]`).

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service status (no secrets) |
| GET | `/api/tasks` | List tasks (`status`, `search`, `sort` optional) |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get one task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST | `/api/ai/plan-task` | Generate an AI plan |

## Health

`GET /api/health` -> `200`

```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "services": { "database": "connected", "aiPlanner": "configured" }
}
```

`aiPlanner` is only ever `configured` or `unconfigured` - no keys or URIs are exposed.

## Task object

```json
{
  "_id": "6ad4628033dc1e0cd3ad00c8",
  "title": "Prepare sprint demo",
  "description": "Walk through the AI planner",
  "status": "pending",
  "dueDate": "2026-12-01T00:00:00.000Z",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

- `title` required, trimmed, 1-200 characters
- `description` optional string, <= 4000 characters, defaults to `""`
- `status` one of `pending` | `in-progress` | `completed` (default `pending`)
- `dueDate` optional ISO date or `null`

## Create task

`POST /api/tasks`

```json
{
  "title": "Prepare sprint demo",
  "description": "Walk through the AI planner",
  "status": "pending",
  "dueDate": "2026-12-01T00:00:00.000Z"
}
```

`201 Created`

```json
{ "success": true, "task": { "_id": "...", "title": "Prepare sprint demo", "status": "pending", "...": "..." } }
```

Errors: `400` (missing/empty title, invalid status, invalid date, unknown field, malformed JSON).

## List tasks

`GET /api/tasks?status=pending&search=demo&sort=dueDate`

`200 OK`

```json
{ "success": true, "count": 1, "tasks": [ { "_id": "...", "title": "Prepare sprint demo" } ] }
```

Supported query parameters (all optional):

- `status`: `pending` | `in-progress` | `completed`
- `search`: case-insensitive match on title or description
- `sort`: `newest` (default) | `oldest` | `dueDateAsc` | `dueDateDesc` | `titleAsc`

The UI performs its own instant client-side filtering on the fetched list; these parameters exist
for API consumers (e.g. the Postman collection).

## Get task by ID

`GET /api/tasks/:id` -> `200 OK`

```json
{ "success": true, "task": { "_id": "..." } }
```

- `400` when `:id` is not a valid MongoDB ObjectId
- `404` when the ID is valid but no task exists

## Update task

`PUT /api/tasks/:id` - send only the fields you want to change.

```json
{ "status": "completed" }
```

`200 OK` with the updated task. Errors: `400` (empty body, unknown field, invalid value),
`404` (no such task).

## Delete task

`DELETE /api/tasks/:id` -> `200 OK`

```json
{ "success": true, "message": "Task deleted successfully.", "task": { "_id": "..." } }
```

`404` if the task does not exist.

## Generate AI plan

`POST /api/ai/plan-task`

```json
{ "description": "I need to build a portfolio website within three days." }
```

`200 OK`

```json
{
  "success": true,
  "plan": {
    "summary": "Build and launch a personal portfolio website.",
    "priority": "high",
    "estimatedHours": 12,
    "steps": [
      "Plan the website structure",
      "Build the responsive layout",
      "Add projects and contact information",
      "Test and deploy the website"
    ]
  }
}
```

Possible failures (all safe, no internals leaked):

| Status | Meaning |
| --- | --- |
| 400 | Missing/empty/too-short/too-long description, or unknown fields |
| 429 | AI provider rate limit reached |
| 502 | Provider returned invalid JSON / failed validation / auth or model error |
| 503 | `GROQ_API_KEY` missing on the server |
| 504 | AI request timed out |

`estimatedHours` is an AI estimate, not a guarantee.

## Status code summary

| Code | Used for |
| --- | --- |
| 200 | Successful reads, updates, deletes, AI plans |
| 201 | Task created |
| 400 | Validation failure, invalid ID, malformed JSON |
| 404 | Unknown route or missing task |
| 413 | Request body too large |
| 429 | Provider rate limit |
| 500 | Unexpected server error (message only) |
| 502/503/504 | AI provider misconfiguration or failure |
