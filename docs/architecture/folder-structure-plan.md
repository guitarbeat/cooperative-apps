# Folder Structure Scalability Plan

## Goals
- Reduce coupling by separating shared primitives from feature code.
- Improve discoverability with clear ownership boundaries.
- Prevent circular dependencies by enforcing layer rules.
- Provide a predictable migration path with explicit dependency checks.

## Proposed Structure
```
src/
  app/
    App.jsx
    main.jsx
    providers/
  features/
    mediation/
      components/
      hooks/
      config/
      utils/
      state/
      tests/
  shared/
    ui/
    hooks/
    utils/
    assets/
    styles/
  test/
    setupTests.js
```

## Dependency Rules
- `shared` must not import from `features` or `app`.
- `features` can import from `shared` only.
- `app` can import from both `features` and `shared`.
- Enforce rules with linting (e.g., `eslint-plugin-boundaries`) before moving files.

## Migration Plan (Safe Order)
1. **Add boundary checks**
   - Introduce module boundary rules (lint config) and validate the current graph.
   - This prevents new circular dependencies during the move.
2. **Create target folders**
   - `src/app`, `src/features/mediation`, `src/shared` (and subfolders).
3. **Move leaf utilities first**
   - Example: `src/lib/utils.js` → `src/shared/utils/cn.js`
   - Update imports in `src/components/ui/*` to point at the new shared location.
4. **Move shared UI primitives**
   - `src/components/ui/*` → `src/shared/ui/*`
   - Update imports in components and App to the new shared UI path.
5. **Move generic hooks**
   - `src/hooks/useDebounce.js` → `src/shared/hooks/useDebounce.js`
   - `src/hooks/useErrorHandler.js` → `src/shared/hooks/useErrorHandler.js`
   - Update any hook or component imports that reference them.
6. **Move mediation feature code**
   - Hooks:
     - `src/hooks/useFormData.js` → `src/features/mediation/hooks/useFormData.js`
     - `src/hooks/useNavigation.js` → `src/features/mediation/hooks/useNavigation.js`
   - Config:
     - `src/config/surveyCategories.js` → `src/features/mediation/config/surveyCategories.js`
   - Utils:
     - `src/utils/stepDependencies.js` → `src/features/mediation/utils/stepDependencies.js`
   - Components:
     - `src/components/*` (non-UI primitives) → `src/features/mediation/components/`
7. **Unify required-fields rules**
   - Create a single `features/mediation/config/requiredFields.js`.
   - Import it from both `useFormData` and `surveyCategories` to remove duplication.
8. **Update app entry points**
   - Update `src/App.jsx` and `src/main.jsx` to import from feature and shared barrels.
9. **Relocate tests**
   - Move feature tests next to the feature code, keep `src/test/setupTests.js` as global setup.
10. **Add barrel exports**
   - `src/shared/index.js`, `src/features/mediation/index.js` to reduce deep relative paths.
11. **Smoke check after each step**
   - Run the dev server or unit tests to validate the move before proceeding.

## Example Import Transitions
- `import { cn } from "../../lib/utils";` → `import { cn } from "@/shared/utils/cn";`
- `import { Toaster } from "./components/ui/sonner";` → `import { Toaster } from "@/shared/ui/sonner";`
- `import { useFormData } from "./hooks/useFormData";` → `import { useFormData } from "@/features/mediation";`

## Notes
- Move files in small batches to keep diffs reviewable.
- Update import paths immediately after each move to avoid broken builds.
- Prefer absolute path aliases (e.g., `@/shared`, `@/features`) to reduce relative path churn.
