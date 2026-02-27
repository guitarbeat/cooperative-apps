# 🤝 Cooperative Apps

A collection of open-source tools designed to empower and support **cooperative communities**, housing cooperatives, and intentional communities. This monorepo serves as a central hub for applications that facilitate communication, conflict resolution, and resource sharing.

---

## 📱 Applications

| App | Description | Tech Stack |
| :--- | :--- | :--- |
| **[House Love](apps/houselove/)** | A platform for connecting cooperative communities with mediators, resources, and training materials. | React, SCSS, Leaflet |
| **[Conflict Mediation](apps/conflict-mediation-platform/)** | A structured, 7-step interactive tool for guided interpersonal conflict resolution. | React, Vite, Tailwind, GSAP |

---

## 🏗 Project Structure

This repository uses **pnpm workspaces** to manage multiple applications efficiently.

```text
cooperative-apps/
├── apps/
│   ├── houselove/                    # House Love Platform
│   └── conflict-mediation-platform/  # Conflict Mediation Tool
├── package.json                      # Root scripts and workspace config
├── pnpm-workspace.yaml               # Workspace definition
└── CONTRIBUTING.md                   # Contribution guidelines
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 22.x** (Required for House Love compatibility)
- **pnpm** (Recommended) or **npm**

### Installation

Install dependencies for all applications from the root directory:

```bash
pnpm install
```

### Running the Apps

You can run the apps individually from the root using these scripts:

**House Love:**
```bash
pnpm houselove:start
```

**Conflict Mediation Platform:**
```bash
pnpm conflict:dev
```

---

## 🛠 Development

For detailed information on how to contribute, please see our **[Contributing Guide](CONTRIBUTING.md)**.

### Key Scripts

- `pnpm install`: Install all dependencies.
- `pnpm houselove:build`: Build House Love for production.
- `pnpm conflict:build`: Build Conflict Mediation Platform for production.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ for the cooperative movement.*
