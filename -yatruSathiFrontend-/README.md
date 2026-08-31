# YatruSathi Frontend

Web client for the YatruSathi travel platform — React 19 + TypeScript + Vite, with
Material UI. Talks to the Django REST API for data and the Flask AI service for the
assistant and real-time group chat.

> Part of a three-service workspace — see the [root README](../README.md).

## Quick start

```bash
npm install
cp .env.example .env          # point VITE_API_BASE_URL at the backend
npm run dev
```

App runs at `http://localhost:5173`.

## Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR |
| `npm run build`   | Type-check and build to `dist/`    |
| `npm run preview` | Serve the production build locally |
| `npm run lint`    | Run ESLint                         |

## Configuration

Copy `.env.example` to `.env`:

| Variable                                       | Purpose                                                |
| ---------------------------------------------- | ------------------------------------------------------ |
| `VITE_API_BASE_URL`                            | Backend API base URL — must end with a trailing slash. |
| `VITE_CHATBOT_URL`                             | AI service URL. Leave blank to disable the assistant.  |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Supabase anon access (RLS-enforced).                   |

## Structure

```
src/
├── api/          Axios client (token injection, error normalisation)
├── services/     API modules by domain, Socket.IO + Supabase clients
├── pages/        Route-level screens (home, events, packages, chat, admin, …)
├── components/   Shared and admin components
├── layout/       App shell
├── common/       Types, constants, hooks, utils, auth helpers
└── assets/
```

## Tech

React 19 · TypeScript · Vite 7 · Material UI 6 · React Router 7 · React Hook Form ·
Axios · Recharts · Socket.IO · Supabase JS
