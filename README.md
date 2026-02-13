# Cooperative Apps

A monorepo containing tools for cooperative communities.

## Apps

- **[House Love](apps/houselove/)** — Cooperative community platform with conflict mediators, resource sharing, and training materials
- **[Conflict Mediation Platform](apps/conflict-mediation-platform/)** — Interactive conflict mediation tool with guided resolution process, emotion charts, and PDF export

## Structure

```
cooperative-apps/
├── apps/
│   ├── houselove/                    # House Love (React + CRA)
│   └── conflict-mediation-platform/  # Conflict Mediation (React + Vite)
├── package.json
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

- Node.js 22.x (required for houselove)
- pnpm (recommended for the monorepo)

### Install Dependencies

```bash
pnpm install
```

### Run Apps

**House Love:**
```bash
cd apps/houselove && npm start
```

**Conflict Mediation Platform:**
```bash
cd apps/conflict-mediation-platform && pnpm dev
```

## License

MIT — see individual app directories for details.
