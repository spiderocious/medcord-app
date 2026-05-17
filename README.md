# Medcord

A healthcare platform monorepo — Electronic Medical Records, patient management, staff coordination, lab orders, and more. Built as an Nx monorepo with a React frontend, Express backend, and shared packages.

## Workspace Overview

```
medcord-app/
├── apps/
│   ├── medcord-web/      # Main patient/staff web application (React + Vite)
│   ├── admin-web/        # Admin dashboard (React + Vite)
│   ├── design-system/    # Component showcase (React + Vite)
│   ├── main-backend/     # REST API (Express + MongoDB)
│   └── website/          # Marketing site (Next.js)
├── packages/
│   ├── ui/               # @medcord/ui — shared React components
│   ├── core/             # @medcord/core — shared types and utilities
│   ├── api/              # @medcord/api — TanStack React Query hooks
│   └── rbac/             # @medcord/rbac — role-based access control
├── docs/                 # API docs, guides, QA plans
├── nx.json
└── pnpm-workspace.yaml
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v6, TanStack React Query 5, Tailwind CSS |
| Build | Vite 6, TypeScript 5.8 |
| Backend | Express 4, Node.js >=20, MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens), bcrypt |
| Validation | Zod |
| Logging | Pino |
| Monorepo | Nx 22, pnpm 9 |

## Prerequisites

- Node.js >=20
- pnpm 9.15.9+
- MongoDB instance (local or remote)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start the backend API (port 8085)
pnpm nx serve main-backend

# Start the main web app (port 5173)
pnpm nx serve medcord-web

# Start the admin dashboard (port 5174)
pnpm nx serve admin-web

# Start the marketing website (port 3000)
pnpm nx serve website
```

## Environment Variables

### Backend (`apps/main-backend/.env`)

```env
NODE_ENV=development
PORT=8085
APP_BASE_URL=http://localhost:8085
WEB_BASE_URL=http://localhost:5173
DATA_LAYER_BASE_URL=<data-service-url>
MONGODB_URI=mongodb://localhost:27017/medcord
JWT_ACCESS_SECRET=<min-32-char-secret>
JWT_REFRESH_SECRET=<min-32-char-secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
LOG_LEVEL=info
```

### Frontend (`apps/medcord-web/.env`)

```env
VITE_API_BASE_URL=http://localhost:8085
```

## Backend Feature Modules

The API is organized into 13 feature modules:

- **auth** — JWT authentication, registration, password reset
- **hospitals** — Hospital/organization management
- **staff** — Staff accounts, roles, invitations
- **patients** — Patient records and demographics
- **emr** — Electronic Medical Records (visits, notes, prescriptions)
- **labs** — Lab orders and results
- **assets** — File/document management
- **review-queue** — Clinical review workflows
- **audit-log** — Immutable audit trail
- **notifications** — In-app notification delivery
- **search** — Full-text search across records
- **admin** — Platform administration
- **health** — Health check endpoints

## Common Commands

```bash
# Run a specific app
pnpm nx serve medcord-web

# Build all projects
pnpm nx run-many -t build

# Type-check all projects
pnpm nx run-many -t typecheck

# Lint all projects
pnpm nx run-many -t lint

# Run tests
pnpm nx run-many -t test

# Build only affected projects (useful in CI)
pnpm nx affected -t build

# Visualize the project dependency graph
pnpm nx graph

# View details for a specific project
pnpm nx show project main-backend --web
```

## Shared Packages

| Package | Import path | Description |
|---|---|---|
| UI components | `@medcord/ui` | Buttons, inputs, tables, modals, toasts, icons |
| Core types | `@medcord/core` | Shared TypeScript types, constants, utilities |
| API hooks | `@medcord/api` | Pre-built TanStack Query hooks for every endpoint |
| RBAC | `@medcord/rbac` | Permission checks, role definitions, guard utilities |

## Scaffolding

```bash
# Add a new React app
pnpm nx g @nx/react:app apps/my-app

# Add a new Express app
pnpm nx g @nx/node:app apps/my-service

# Add a shared package
pnpm nx g @nx/js:lib packages/my-lib

# Add a React component to a package
pnpm nx g @nx/react:component MyComponent --project=ui
```

## Design System

The `design-system` app runs a component showcase at port 5175:

```bash
pnpm nx serve design-system
```

Components are built in `packages/ui` and consumed by both `medcord-web` and `admin-web`.

## Docs

Extended documentation lives in `/docs`:

- `docs/api/` — API endpoint references and RBAC spec
- `docs/guides/` — Development guides
- `docs/product/` — Product specifications
- `docs/qas/` — QA test plans and reports
