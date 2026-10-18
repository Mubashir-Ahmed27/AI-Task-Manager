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

## 5. Frontend on Render (Static Site)

| Setting | Value |
| --- | --- |
| Root directory | `client` |
| Build command | `npm install && npm run build` |
| Publish directory | `dist` |
| Redirect / rewrite | `/*` -> `/index.html` (SPA routing) |

Environment variable:

```
VITE_API_URL=https://your-backend.onrender.com
```

Vite bakes `VITE_*` values into the bundle at build time, so change it and redeploy after the
backend URL is known. Do not put secrets in it.

### Alternative: single-service deployment

The Express app does not serve the SPA build by default. If you prefer one Render service, add
static file serving to `server/src/app.js` (e.g. `express.static` on `client/dist` plus a
catch-all `res.sendFile('index.html')`) and keep `VITE_API_URL` empty so the frontend calls
`/api` on the same origin. Document whatever you choose.

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

## 7. Production checklist

- [ ] `MONGODB_URI` set and Atlas network access configured
- [ ] `GROQ_API_KEY` set only on the backend
- [ ] `CLIENT_ORIGIN` matches the deployed frontend exactly (scheme + host, no trailing slash)
- [ ] `VITE_API_URL` points at the deployed backend and the frontend was rebuilt
- [ ] `/api/health` reports `database: connected`
- [ ] CORS: requests from the deployed frontend succeed; other origins are rejected
- [ ] No secrets in the repository or in the built bundle (`grep -r "gsk_" client/dist`)
- [ ] MongoDB Atlas backups/snapshot policy reviewed (optional but recommended)
