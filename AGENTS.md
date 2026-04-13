# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

Baby Growth Photo Album (宝贝成长相册) — a full-stack TypeScript app with two independent services: **backend** (NestJS) and **frontend** (React/Vite). No monorepo tooling; each has its own `package.json` under `/workspace/backend` and `/workspace/frontend`.

### Services

| Service | Directory | Dev Command | Port | Notes |
|---------|-----------|-------------|------|-------|
| Backend | `backend/` | `npm run start:dev` | 3001 | NestJS with hot-reload |
| Frontend | `frontend/` | `npm run dev -- --host 0.0.0.0` | 5173 | Vite with HMR |

### Backend Setup Caveats

- **`.env` required**: The backend needs a `.env` file at `backend/.env`. Key vars: `DATABASE_URL="file:./dev.db"`, `JWT_SECRET`, `PORT=3001`. S3 vars are optional (only needed for photo upload features).
- **Prisma init**: After `npm install`, you must run `npx prisma generate && npx prisma db push` in the `backend/` directory to create the SQLite database and generate the Prisma client.
- **SQLite in dev**: Dev uses file-based SQLite (`backend/prisma/dev.db`). No external database needed.

### Standard Commands (see `package.json` scripts)

- **Backend lint**: `cd backend && npm run lint`
- **Backend test**: `cd backend && npm run test`
- **Frontend lint**: `cd frontend && npm run lint`
- **Frontend build**: `cd frontend && npm run build`

### Known Pre-existing Issues

- Backend lint has `@typescript-eslint/no-unsafe-*` warnings across several files (audit, auth, common modules).
- Backend Jest tests fail on `uuid` ESM import — the `uuid` package ships ESM-only and Jest config needs `transformIgnorePatterns` adjustment.
- Frontend `tsc` build has type errors in `AcceptInvitePage.tsx` and `PhotoDetailPage.tsx`.
- Frontend ESLint reports `react-hooks/immutability` errors in `PhotoViewer.tsx`.

These are all pre-existing in the repository and not introduced by environment setup.

### MinIO (Optional)

Photo upload/download features require an S3-compatible store. For local dev, run MinIO via Docker:
```
docker run -d --name minio -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```
Without MinIO, auth/family/children/audit features still work.
