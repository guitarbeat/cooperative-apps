## 2025-02-18 - CSS Injection in ChartStyle
**Vulnerability:** Found unsanitized user input being injected into a <style> tag via dangerouslySetInnerHTML in a Chart component.
**Learning:** Even UI libraries (like shadcn/ui or Recharts wrappers) can introduce XSS vectors if they interpolate props directly into style tags. React's default escaping does not apply to dangerouslySetInnerHTML.
**Prevention:** Always sanitize dynamic values injected into <style> blocks, removing characters like <, >, {, }, ; to prevent breaking out of the context.

## 2025-05-23 - URL Input Validation
**Vulnerability:** Input fields of type `url` allowed `javascript:` and other potentially dangerous protocols because `new URL()` validation only checks for valid URL syntax, not safe protocols.
**Learning:** `new URL()` is not sufficient for security validation of user-provided URLs. It accepts `javascript:`, `data:`, `file:`, etc.
**Prevention:** Explicitly validate `url.protocol` against an allowlist (e.g., `http:`, `https:`) when accepting URL inputs.

## 2024-03-22 - [DOM-based XSS in Policy Generator]
**Vulnerability:** User inputs (`processValue`, `mediators`, `timeline`, `channels`, `frequency`) in `apps/houselove/public/training-tools/js/interactive.js` were interpolated into a template string and assigned to `innerHTML` without sanitization.
**Learning:** Vanilla JS files handling dynamic DOM insertion are high-risk areas for XSS, especially when migrating or maintaining older tools alongside modern frameworks.
**Prevention:** Always define and use an `escapeHTML` helper function before injecting user-controlled data into `innerHTML` or use safer alternatives like `textContent`.
