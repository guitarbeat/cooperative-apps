## 2025-02-18 - CSS Injection in ChartStyle
**Vulnerability:** Found unsanitized user input being injected into a <style> tag via dangerouslySetInnerHTML in a Chart component.
**Learning:** Even UI libraries (like shadcn/ui or Recharts wrappers) can introduce XSS vectors if they interpolate props directly into style tags. React's default escaping does not apply to dangerouslySetInnerHTML.
**Prevention:** Always sanitize dynamic values injected into <style> blocks, removing characters like <, >, {, }, ; to prevent breaking out of the context.

## 2025-05-23 - URL Input Validation
**Vulnerability:** Input fields of type `url` allowed `javascript:` and other potentially dangerous protocols because `new URL()` validation only checks for valid URL syntax, not safe protocols.
**Learning:** `new URL()` is not sufficient for security validation of user-provided URLs. It accepts `javascript:`, `data:`, `file:`, etc.
**Prevention:** Explicitly validate `url.protocol` against an allowlist (e.g., `http:`, `https:`) when accepting URL inputs.

## $(date +%Y-%m-%d) - [CRITICAL] Fix DOM-based XSS in Policy Generator
**Vulnerability:** The `interactive.js` script in `apps/houselove/public/training-tools/js/interactive.js` was reading user inputs (radio buttons, checkboxes, and text inputs) and directly interpolating them into a raw HTML string (`policyHTML`) assigned to `innerHTML` without sanitization.
**Learning:** Client-side vanilla JavaScript files directly manipulating the DOM using `innerHTML` are highly susceptible to XSS if any of the concatenated strings derive from user input.
**Prevention:** Always use a helper like `escapeHTML` to sanitize user inputs before concatenating them into strings meant for `innerHTML`, or prefer using safer alternatives like `textContent` or `innerText` when rendering plain text.
