# Repository Organization

This file documents the intended structure of the monorepo and where new code should live.

## Package Placement Rules

- Add user-facing apps under `apps/<app-name>/` unless the app is already established elsewhere.
- Keep shared scripts or repo-level tooling at the repository root.
- Avoid creating nested repositories inside this repo.

## Current Package Map

- `apps/co-op-stack`
- `apps/houselove`
- `apps/conflict-mediation-platform`
- `apps/voting`

## Root File Conventions

- Keep root focused on workspace config and project docs.
- Do not commit transient runtime logs (for example `server.log`, `push_error.txt`).
- Do not commit ad hoc archive files (`*.zip`) unless explicitly needed for release artifacts.
