# AI Course Creator SaaS

This repository contains a full-stack FastAPI + React application that helps teachers, researchers, and academies build courses with AI assistance. The UX guides creators through setup, outlines, lesson planning, content drafting, and quiz creation while keeping humans in control at every step.

## Features

- **Stepwise AI assistance**: Generate objectives and module outlines, suggest module lessons, draft lesson content, and create quizzes through scoped endpoints instead of dumping full courses.
- **Creator-first workflow**: Sidebar progress map, top stepper, and per-step editors ensure drafts are reviewed and confirmed by the creator.
- **FastAPI backend**: Typed request/response models, AI helper routes under `/api/ai`, and a stubbed AI client that can be swapped for a real provider.
- **React + Chakra UI v3 frontend**: Creator layouts, data hooks, and route pages for course setup, outlines, lessons, content, and quizzes.
- **Auth-ready template**: Built on the FastAPI full-stack template with JWT auth, CORS, and Sentry hooks.
- **Docker Compose friendly**: Run the entire stack locally with Postgres via the provided compose files.

## Repository Layout

```
.
├── backend/                # FastAPI app, tests, and supporting scripts
│   └── app/
│       ├── api/            # API routers (including AI routes)
│       ├── core/           # Settings, security, configuration
│       ├── services/       # AI client abstraction
│       └── main.py         # FastAPI application factory
├── frontend/               # React + Chakra UI app (Vite + TypeScript)
│   └── src/
│       ├── components/creator/  # Layout shell, sidebar, stepper
│       ├── hooks/               # Creator data provider
│       ├── lib/                 # Frontend AI client helper
│       └── routes/creator/      # Course, module, lesson, quiz pages
├── docker-compose.yml      # Local stack (frontend, backend, Postgres, Traefik)
├── development.md          # Compose workflow instructions
└── scripts/                # Helper scripts for tests and tooling
```

## Prerequisites

- Node.js 18+ and npm (for the frontend)
- Python 3.11+ and [uv](https://docs.astral.sh/uv/) (for backend dependency management)
- Docker + Docker Compose (recommended for running the full stack)

## Backend Setup

1. Navigate to `backend/` and install dependencies:

   ```bash
   uv sync
   ```

2. Create a `.env` file based on `.env.example` (from the FastAPI template) and set at least:

   - `SECRET_KEY`
   - `FIRST_SUPERUSER_PASSWORD`
   - `POSTGRES_SERVER`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
   - `AI_API_KEY` (optional; used by the AI client abstraction)

3. Initialize the database (if running locally without Docker) and apply migrations:

   ```bash
   uv run alembic upgrade head
   ```

4. Start the API server with live reload:

   ```bash
   uv run fastapi dev app/main.py
   ```

Key AI endpoints (prefixed by `/api/v1/ai`):

- `POST /course-outline` – generate course objectives and module outline.
- `POST /module-lessons` – suggest ordered lesson titles per module.
- `POST /lesson-content` – draft structured content for a single lesson.
- `POST /lesson-quiz` – generate multiple-choice questions for a lesson.

These routes delegate to `app/services/ai_client.py`, which currently provides predictable stubbed responses.

## Frontend Setup

1. Navigate to `frontend/` and install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` (or `.env.local`) file to point the app to your backend API, for example:

   ```bash
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Build for production:

   ```bash
   npm run build
   ```

### Creator Flow Highlights

- **Layout**: `CreatorLayoutShell` wraps all creator pages with `ProgressSidebar` and `TopStepper` navigation.
- **Course setup**: `/creator/courses/new` captures minimal metadata and triggers outline generation.
- **Outline editing**: `/creator/courses/[courseId]/outline` lets creators edit objectives/modules and confirm the outline.
- **Lesson planning**: `/creator/modules/[moduleId]/lessons` manages lesson titles and ordering for each module.
- **Lesson content**: `/creator/lessons/[lessonId]` drafts structured sections and allows confirmation per lesson.
- **Quizzes**: `/creator/lessons/[lessonId]/quiz` manages AI-generated quiz questions with manual edits before saving.

The frontend calls the backend AI routes through `src/lib/aiClient.ts` to keep all AI interactions centralized.

## Running with Docker Compose

Use Docker when you want the full stack (backend, frontend, Postgres, Traefik) running together:

```bash
docker compose up --build
```

The default configuration exposes the backend on port `8000` and the frontend on port `3000`. See `development.md` for live-reload options and tips on working inside the containers.

## Testing

- Backend: `bash ./scripts/test.sh`
- Frontend: `npm run test` (unit) and `npm run test:e2e` for Playwright (requires the app to be running)

## Notes

- The AI client is stubbed for predictable demo responses; replace `generate_ai_response` in `backend/app/services/ai_client.py` with a real provider when ready.
- Authentication, security, and database models come from the FastAPI full-stack template; extend them as needed for production.
