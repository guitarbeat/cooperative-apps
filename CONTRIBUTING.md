# Contributing to Cooperative Apps

Thank you for your interest in contributing to Cooperative Apps! We welcome contributions from the community to help build better tools for cooperative living.

## 🏗 Monorepo Structure

This project is a monorepo managed with `pnpm` workspaces.

- `apps/houselove`: Cooperative community platform (React + CRA).
- `apps/conflict-mediation-platform`: Interactive conflict mediation tool (React + Vite).

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 22.x or higher.
- **pnpm**: Recommended for managing dependencies.

### Local Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/guitarbeat/cooperative-apps.git
    cd cooperative-apps
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Run applications**:
    - To run House Love: `pnpm houselove:start`
    - To run Conflict Mediation Platform: `pnpm conflict:dev`

## 🛠 Development Workflow

1.  **Create a Branch**: Create a descriptive branch name for your changes.
    ```bash
    git checkout -b feature/your-feature-name
    ```

2.  **Make Changes**: Follow the coding standards of the specific app you are working on.

3.  **Commit Changes**: Use clear and concise commit messages.
    ```bash
    git commit -m "feat: add new mediation step"
    ```

4.  **Push and Open a PR**: Push your branch to GitHub and open a Pull Request against the `main` branch.

## 🎨 Coding Standards

- **React**: Use functional components and hooks.
- **Styling**: 
  - House Love uses **SCSS**.
  - Conflict Mediation Platform uses **Tailwind CSS**.
- **Linting**: Run `pnpm lint` (if available) before committing.

## 📝 Adding a New App

If you want to add a new application to the monorepo:
1. Create a new directory in `apps/`.
2. Initialize your project (e.g., `pnpm create vite`).
3. Add relevant scripts to the root `package.json`.
4. Update the root `README.md` to include the new app.

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
