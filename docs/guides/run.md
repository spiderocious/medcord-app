# Running Solon

The workspace is a pnpm + Nx monorepo. Every app lives under `apps/`; every shared library lives under `packages/`. Use `pnpm` for everything — `npm` and `yarn` are blocked by the root `preinstall` hook.

## Prerequisites

- Node.js **>= 20**
- pnpm **>= 9.15** (`brew install pnpm` or `corepack enable && corepack prepare pnpm@9.15.9 --activate`)
- Ports free locally: **8083** (main-backend), **8082** (data-layer), **5173** (solon-web), **5174** (solon-admin-web), **3000** (solon-website), **4173/4174** (vite preview)