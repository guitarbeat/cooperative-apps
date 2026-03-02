# Cooperative Apps Monorepo

This repository contains multiple cooperative-community applications managed as a single monorepo.

## Applications

- `apps/houselove`: House Love platform
- `apps/conflict-mediation-platform`: Conflict Mediation platform
- `apps/voting`: Voting app
- `apps/co-op-stack`: Stack Master meeting facilitation app

## Repository Layout

```text
cooperative-apps/
  apps/
    co-op-stack/
    conflict-mediation-platform/
    houselove/
    voting/
  package.json
  pnpm-workspace.yaml
  CONTRIBUTING.md
  CODE_OF_CONDUCT.md
```

## Prerequisites

- Node.js 18+ (Node.js 22 recommended)
- pnpm 8+

## Install

```bash
pnpm install
```

## Run Apps

```bash
pnpm conflict:dev
pnpm houselove:start
pnpm voting:dev
pnpm stack:dev
```

## Build and Test

```bash
pnpm build:all
pnpm test:all
```

## Notes

- Workspace packages are defined in `pnpm-workspace.yaml`.
- Root scripts are in `package.json`.
- For contribution workflow, see `CONTRIBUTING.md`.
