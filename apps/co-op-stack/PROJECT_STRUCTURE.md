# Project Structure

This document describes the organized structure of the Stack Master Tool project.

## Root Directory Organization

The project root has been reorganized into logical folders for better maintainability:

### 📁 Core Application
- `src/` - Source code (React components, hooks, utilities, etc.)
- `public/` - Static assets (images, icons, etc.)
- `supabase/` - Database configuration and migrations
- `docs/` - Documentation files
- `config/` - Build and development configuration files

### 📁 Configuration (`.config/`)
Contains all configuration files and dotfiles:
- `.enforcer/` - Code enforcement tools
- `.github/` - GitHub workflows and templates
- `.vscode/` - VS Code settings and extensions
- `.gitignore` - Git ignore rules
- `.unimportedrc.json` - Unused import detection config
- `eslint.config.js` - ESLint configuration
- `capacitor.config.ts` - Capacitor mobile app config
- `tailwind.config.ts` - Tailwind CSS configuration

### 📁 Tools (`.tools/`)
Development and testing tools:
- `playwright.config.ts` - End-to-end testing configuration
- `.dev/` - Development utilities and scripts

### 📁 Build Output (`.build/`)
Compiled and built files:
- `dist/` - Production build output (moved from root)

### 📁 Reports (`.reports/`)
Test results and analysis reports:
- `playwright-report/` - Playwright test reports
- `test-results/` - Test execution results

## Key Files in Root
- `package.json` - Project dependencies and scripts
- `pnpm-lock.yaml` - Dependency lock file
- `index.html` - Main HTML entry point
- `README.md` - Project documentation

## Benefits of This Organization

1. **Cleaner Root**: Only essential files remain in the root directory
2. **Logical Grouping**: Related files are grouped together
3. **Better Maintainability**: Easier to find and manage configuration files
4. **Reduced Clutter**: Build artifacts and reports are contained in dedicated folders
5. **Clear Separation**: Configuration, tools, and output are clearly separated

## Updated Scripts

The following package.json scripts have been updated to work with the new structure:
- `clean` - Now cleans the new build and report directories
- `deploy:netlify` - Points to the new build directory
- All other scripts continue to work as before

## Migration Notes

- All configuration files have been moved to `.config/`
- Build output is now in `.build/dist/`
- Test reports are now in `.reports/`
- All import paths and references have been updated accordingly
