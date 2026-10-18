# Deployment Guide

> Status: the application has been verified locally. Nothing below has been executed against a
> real Render account, so treat the deployment steps as documented preparation, not proof of a
> live deployment.

## 1. Before you deploy

- `npm run test:server` and `npm run test:client` pass.
- `npm run build` succeeds (frontend production bundle).
- `NODE_ENV=production` requires `MONGODB_URI`; the server refuses to boot without it.
- `.env` files stay out of Git (see `.gitignore`). Only `.env.example` files are committed.

## 2. MongoDB Atlas

1. Create a free cluster at https://cloud.mongodb.com.
2. **Database Access** -> add a database user (password auth, not your Atlas login).
3. **Network Access** -> allow the Render egress range. `0.0.0.0/0` is the quick option for a
   student project; restrict it later.
4. Copy the driver connection string and swap in your user/password:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/ai-task-manager?retryWrites=true&w=majority`
5. Store it as `MONGODB_URI` on the host. Never commit it.

## 3. Groq API key

1. Sign in at https://console.groq.com and open **API Keys** -> **Create API Key**.
2. Store the key as `GROQ_API_KEY` on the **backend** host only.
3. Pick an active production model; `llama-3.3-70b-versatile` is a valid default,
   `openai/gpt-oss-20b` is another currently listed production model.
4. Verify with the health endpoint (`services.aiPlanner` becomes `configured`) and one request to
   `POST /api/ai/plan-task`.

## 4. Backend on Render (Web Service)

| Setting | Value |
| --- | --- |
| Root directory | `server` |
| Runtime | Node |
| Build command | `npm install` |
| Start command | `npm start` |
| Health check path | `/api/health` |

Environment variables:

```
NODE_ENV=production
PORT=10000            # Render injects PORT; this is only a fallback
MONGODB_URI=<atlas connection string>
GROQ_API_KEY=<your key>
GROQ_MODEL=llama-3.3-70b-versatile
CLIENT_ORIGIN=https://your-frontend.example.com
AI_TIMEOUT_MS=15000
```

`CLIENT_ORIGIN` accepts a comma-separated list if you need several origins (e.g. preview URLs).
Requests without an `Origin` header (curl, Postman, health checks) are allowed.

## 5. Frontend on Vercel (recommended)

The repository root contains `vercel.json`, so you can import the repo as-is:

```json
{
  "framework": "vite",
  "installCommand": "npm --prefix client ci",
  "buildCommand": "npm --prefix client run build",
  "outputDirectory": "client/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

| Setting | Value |
| --- | --- |
| Framework preset | Vite (detected from `vercel.json`) |
| Root directory | repository root (leave empty) |
| Install command | `npm --prefix client ci` |
| Build command | `npm --prefix client run build` |
| Output directory | `client/dist` |
| Environment variable | `VITE_API_URL=https://your-backend.onrender.com` |

The rewrite makes deep links such as `/tasks` and `/ai-planner` load the SPA instead of a 404.
`VITE_API_URL` is baked into the bundle at build time, so set it **before** the first deploy and
redeploy after changing it. Never put server secrets in Vercel environment variables that start
with `VITE_`.

Then add the Vercel URL to the backend's `CLIENT_ORIGIN` (comma-separated if you also use preview
deployments, e.g. `https://app.vercel.app,https://app-git-main-you.vercel.app`).

Deploy from the CLI instead of the dashboard if you prefer:

```bash
npm i -g vercel
vercel            # preview
vercel --prod     # production
```

> The Express API cannot run on Vercel as-is (it is a long-running Node server, not a serverless
> function). Keep the backend on Render and let Vercel host only the static frontend.

### Alternative: Frontend on Render (Static Site)

| Setting | Value |
| --- | --- |
| Root directory | `client` |
| Build command | `npm install && npm run build` |
| Publish directory | `dist` |
| Redirect / rewrite | `/*` -> `/index.html` (SPA routing) |

Environment variable: `VITE_API_URL=https://your-backend.onrender.com`.

### Alternative: single-service deployment

The Express app does not serve the SPA build by default. If you prefer one Render service, add
static file serving to `server/src/app.js` (e.g. `express.static` on `client/dist` plus a
catch-all `res.sendFile('index.html')`) and keep `VITE_API_URL` empty so the frontend calls
`/api` on the same origin. Document whatever you choose.

## 5b. Build warnings you may see

**`Detected "engines": { "node": ">=20.0.0" } ... will automatically upgrade`**
Fixed: all three `package.json` files now pin `"engines": { "node": "22.x" }`. A range like
`>=20` lets a host jump to an untested major version; `22.x` keeps Node 22 LTS and never rolls
forward automatically. If you intentionally want a different major, change it in one place per
package.

**`npm warn Unknown env config "cache-dir"`**
Cosmetic, and not caused by this repository (there is no `.npmrc` here). The build image sets
`npm_config_cache_dir`, and older npm versions (10.x and below) warn because the supported key is
`cache`, not `cache-dir`. It disappears with npm 11+, so either ignore it or:

- remove `NPM_CONFIG_CACHE_DIR` from the project's environment variables if you added it yourself,
- or set the supported spelling `NPM_CONFIG_CACHE=/vercel/.npm` instead.

It never fails a build: the install, build, and deploy all continue normally.

## 6. Verification after deploy

```bash
curl https://your-backend.onrender.com/api/health
# expect {"success":true,"status":"ok","services":{"database":"connected","aiPlanner":"configured"}}

curl -X POST https://your-backend.onrender.com/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Deployment smoke test"}'
```

Then in the browser: open the frontend, create/edit/delete a task, hard-refresh to confirm the
data came from MongoDB, and generate one AI plan.

## 7. Troubleshooting deployments

### "405 Method Not Allowed" / API calls fail on Vercel

Symptom: every page shows an error, DevTools shows `405 (Method Not Allowed)` for `POST /api/tasks`,
or the response body is the app's HTML instead of JSON.

Cause: the browser is calling **the static frontend host** (`https://your-app.vercel.app/api/...`)
instead of the Express backend. Vercel serves static files only, so a `POST` to that path returns
405 and a `GET` falls through the SPA rewrite to `index.html`. Requests without `VITE_API_URL` are
sent to the current origin, which is exactly this case.

Diagnose in 10 seconds:

```bash
curl -i https://your-app.vercel.app/api/health
# HTML (starting with <!doctype html>) or 405  -> the API is not on this host
curl -i https://your-backend.onrender.com/api/health
# {"success":true,...}                          -> the API itself is fine
```

Fix:

1. Vercel → Project → **Settings → Environment Variables** → add
   `VITE_API_URL = https://your-backend.onrender.com` (no trailing slash, correct scheme).
2. **Redeploy.** `VITE_*` values are inlined at build time, so an existing deployment keeps calling
   the old URL until it is rebuilt (`Deployments → ⋯ → Redeploy`, untick "use existing build cache").
3. Confirm the value made it into the bundle:
   ```bash
   grep -ro "https://[a-z0-9.-]*onrender.com" client/dist/assets | head -1
   ```
4. On the backend, set `CLIENT_ORIGIN=https://your-app.vercel.app` (comma-separated for previews) and
   redeploy it so CORS allows the browser origin.

The frontend now detects this situation and shows an actionable message ("The request reached the
static site host instead of the API…") instead of a raw 405.

### Hosting the API on Vercel?

A plain Express server is a long-running process; Vercel's static/edge hosting cannot run it. Options:

- **Recommended:** keep the API on Render (or Fly.io or Railway) and point `VITE_API_URL` at it.
- Advanced: add a serverless adapter (`api/[...path].js` exporting a handler that reuses one Mongoose
  connection) and install the server dependencies in the build. That works, but serverless cold
  starts and function time limits (10 s on Hobby, less than our 15 s AI timeout) make it a poor fit
  for this project.

### CORS error instead of 405

`blocked by CORS policy` means the request reached the correct backend but the browser origin is not
allowed. Add the frontend origin to `CLIENT_ORIGIN` on the backend and redeploy it.

## 8. Production checklist

- [ ] `MONGODB_URI` set and Atlas network access configured
- [ ] `GROQ_API_KEY` set only on the backend
- [ ] `CLIENT_ORIGIN` matches the deployed frontend exactly (scheme + host, no trailing slash)
- [ ] `VITE_API_URL` points at the deployed backend and the frontend was rebuilt
- [ ] `https://your-app.vercel.app/api/health` is answered by the backend, not the static host
  (a 405 or an HTML response means the API URL is missing)
- [ ] `/api/health` reports `database: connected`
- [ ] CORS: requests from the deployed frontend succeed; other origins are rejected
- [ ] No secrets in the repository or in the built bundle (`grep -r "gsk_" client/dist`)
- [ ] MongoDB Atlas backups/snapshot policy reviewed (optional but recommended)
