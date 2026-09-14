# Student Development Assistant — SGOS Assessment 01

Mini AI-powered Student Development Assistant. Built for SGOS Product
Engineer Assessment — Test 1 (Product & AI Prototype).

## 1. Product overview

A single-page app where a self-learner (bootcamp/online-course learner)
enters their learning goal, current activities, strengths, challenges and
short-term goal, and gets back a structured AI assessment: overview,
observations, suggested actions, and a short-term plan. Every submission is
persisted and shows up in a history list, so a user can revisit what input
produced what result.

## 2. Problem definition

Self-learners study across scattered sources (courses, projects, tutorials)
without a mentor or advisor. They struggle to step back and answer: where am
I, what's actually working, what should I do next. This prototype gives them
that reflection point on demand, and lets them come back to it.

## 3. Target user

Self-learners — people learning outside a formal institution (bootcamp
students, MOOC learners, self-taught devs) with a concrete short-term goal
but no built-in feedback loop.

## 4. User flow

Chat-app style layout: a sidebar (shadcn/ui `Sidebar`) on the left holds
"New evaluation" and the history list; the main panel shows exactly one
view at a time — never both stacked, so switching views never requires
scrolling.

1. User lands on the page — main panel shows the 5-field form.
2. Fills in: learning goal, current activities, strengths, challenges,
   short-term goal.
3. Submits → button shows "Analyzing...".
4. On success: main panel switches to the result view; the sidebar's
   history list refreshes with the new entry (active/highlighted).
5. On failure (invalid input, AI error): an inline error message explains
   what went wrong; form state is preserved so the user can retry.
6. Clicking a past entry in the sidebar switches the main panel to a
   read-only view of that evaluation (original input + the AI output it
   produced). A "New evaluation" button (sidebar top, and repeated in the
   result header) returns to the form instantly from any view.

## 5. Architecture

```
Browser (single-flow page: form → result → history)
   │ POST /api/evaluate { learningGoal, currentActivities, strengths, challenges, shortTermGoal }
   ▼
Next.js API route (src/app/api/evaluate/route.ts)
   │ 1. parse + Zod-validate input → 400 if invalid
   │ 2. load active PromptVersion from DB (auto-seeds v1 if empty)
   │ 3. call AI provider (src/lib/ai.ts) with that prompt's content
   │ 4. parse + Zod-validate AI JSON response
   │ 5. persist Evaluation (input + output + promptVersionId)
   │ 6. persist RequestLog (status/latency/error) — always, success or fail
   ▼
Custom OpenAI-compatible endpoint (api.commandcode.ai/provider/v1)
   │ 1 retry on network/HTTP failure → still failing → 502
   │ response not valid JSON / wrong shape → 422
   ▼
Frontend renders 4 sections, or a clear inline error

GET /api/evaluations       → history list (id, learningGoal, createdAt)
GET /api/evaluations/:id   → one evaluation's full input + output
```

Postgres via Prisma stores `PromptVersion`, `Evaluation`, `RequestLog` (see
`prisma/schema.prisma`). Single Next.js app (frontend + backend) + one
Postgres service, both run together via Docker Compose.

## 6. Technical decisions

- **Next.js full-stack over separate FE/BE**: one repo, one deploy; API
  routes are enough backend for this scope.
- **Prisma + Postgres for persistence**: evaluation history and prompt
  versions need real queries (list, lookup by id, "find active prompt") —
  a proper relational store fits better than flat files, and Prisma keeps
  the schema/migrations explicit and typed.
- **Zod for both input and AI-output validation**: input never trusted from
  the client; AI output never trusted even when the HTTP call succeeds — a
  200 response can still contain malformed or missing fields.
- **Prompt versioning lives in the DB, not in code**: `PromptVersion` rows
  (name, version, content, isActive) let the prompt be edited without a
  deploy, and every `Evaluation` row records exactly which prompt version
  produced it — critical for debugging "why did the AI say that" later.
- **`RequestLog` is a separate table from `Evaluation`**: evaluation history
  is user-facing product data; request logs are technical/operational data
  (status code, latency, error message) and get written on every request,
  including ones that never produce a usable evaluation (e.g. invalid
  input). Keeping them apart means the history list never shows failed,
  incomplete attempts.
- **One retry on provider/network failure, no retry on invalid schema** —
  a schema mismatch is a prompt/parsing problem, not a transient one;
  retrying it just wastes a call.
- **No auth** — evaluation history is global (not per-user) in this
  prototype; out of scope, called out explicitly rather than faked.
- **shadcn/ui `Sidebar` for navigation**: the history list needed a
  persistent, always-reachable nav (chat-session style) rather than a list
  stacked below the form — switching between "new evaluation" and any past
  entry had to never require scrolling.

## 7. AI workflow

1. Frontend collects 5 fields, sends as JSON to `/api/evaluate`.
2. Backend loads the active `PromptVersion` from the DB (creates v1 from a
   built-in default the first time the table is empty).
3. Builds a single prompt (that version's system content + a user message
   built from the 5 fields).
4. Calls the configured OpenAI-compatible endpoint with
   `response_format: { type: "json_object" }`.
5. Parses the returned JSON, validates with Zod against:
   ```json
   {
     "summary": "string",
     "observations": ["string", "..."],
     "suggested_actions": ["string", "..."],
     "short_term_plan": ["string", "..."]
   }
   ```
6. Persists an `Evaluation` row (input, output, which `PromptVersion` was
   used) and a `RequestLog` row (status, latency, error if any).
7. Returns the evaluation to the frontend, or a typed error
   (`400` invalid input / `502` provider failure / `422` invalid AI
   response / `500` unexpected).

## 8. Setup instructions

### Option A — Docker Compose (app + Postgres together)

```bash
cp .env.example .env   # fill in AI_API_KEY
npm run docker:up      # builds the app image, starts app + db
# → http://localhost:3000
```

### Option B — local dev, Postgres in Docker

```bash
npm install
cp .env.example .env.local   # fill in AI_API_KEY
docker compose up -d db      # Postgres only, port-mapped to localhost:5432
npm run db:migrate           # applies prisma/migrations
npm run dev                  # http://localhost:3000
```

```bash
npm run build && npm start   # production build (local, no Docker)
npm run lint                 # eslint
npm run db:seed              # manually seed prompt v1 (auto-seeds on first request too)
```

## 9. Environment variables

| Variable | Required | Description |
|---|---|---|
| `AI_API_BASE_URL` | Yes | Base URL of the OpenAI-compatible endpoint (default in `.env.example`: `https://api.commandcode.ai/provider/v1`) |
| `AI_API_KEY` | Yes | API key for the endpoint above |
| `AI_MODEL` | No | Model name to request (default: `gpt-4o-mini`) |
| `DATABASE_URL` | Yes | Postgres connection string (Prisma) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Yes (Docker) | Used by `docker-compose.yml` to configure the `db` service |

## 10. Known limitations

- No auth/multi-user — evaluation history is global, not scoped to a real
  account system.
- Prompt versioning has no UI to switch/edit the active version yet — it's
  a DB table you'd update directly (or via `prisma studio`) today.
- No automated eval set for prompt regressions (see bonus items not done).
- AI reliability depends on the configured endpoint actually honoring
  `response_format: json_object`; if it doesn't, Zod validation will
  correctly reject malformed output but the user just sees a generic retry
  message rather than a root-cause explanation.

## 11. Future improvements

- Admin UI to create/activate `PromptVersion` rows and compare outputs
  across versions for the same input (A/B evaluation).
- Persist per-user history once auth exists (see Assessment 02 — Task A,
  "progress check-in" feature) instead of a global list.
- Streaming the AI response instead of waiting for the full JSON.
- Basic tests for the API routes (valid input / invalid input / mocked AI
  failure / mocked invalid AI response).
- A small eval set to catch regressions when the active prompt changes.

---

See also: `SOLUTION_APPROACH.md` (tiếng Việt) for the reasoning behind
these product/technical decisions, written for the reviewer.
