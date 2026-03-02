# Contributing to icc-data-cleaner

Thank you for your interest in contributing!

## Code Standards

We use standard tools to ensure code quality:

- **ESLint**: For static code analysis and enforcing coding standards (Airbnb config).
- **Prettier**: For code formatting.

## Development Workflow

1.  **Install Dependencies**: `npm install`
2.  **Linting**: Run `npm run lint` to check for issues. Run `npm run lint:fix` to auto-fix them.
3.  **Formatting**: Run `npm run format` to auto-format your code.
4.  **Testing**: Run `npm test` to ensure your changes work as expected.

## Pre-commit Hooks

We use [pre-commit](https://pre-commit.com/) to automatically run checks before you commit.

1.  Install pre-commit: `pip install pre-commit` (or via brew/etc.)
2.  Install hooks: `pre-commit install`

This will run trailing whitespace checks, end-of-file fixer, Prettier, and ESLint on your staged files.

## Pull Requests

- Ensure all checks pass locally before submitting a PR.
- CI will run automatically on your PR to verify linting, formatting, and tests.
