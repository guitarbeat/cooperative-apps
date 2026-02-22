## 2025-02-18 - CSS Injection in ChartStyle
**Vulnerability:** Found unsanitized user input being injected into a <style> tag via dangerouslySetInnerHTML in a Chart component.
**Learning:** Even UI libraries (like shadcn/ui or Recharts wrappers) can introduce XSS vectors if they interpolate props directly into style tags. React's default escaping does not apply to dangerouslySetInnerHTML.
**Prevention:** Always sanitize dynamic values injected into <style> blocks, removing characters like <, >, {, }, ; to prevent breaking out of the context.

## 2025-05-23 - URL Input Validation
**Vulnerability:** Input fields of type `url` allowed `javascript:` and other potentially dangerous protocols because `new URL()` validation only checks for valid URL syntax, not safe protocols.
**Learning:** `new URL()` is not sufficient for security validation of user-provided URLs. It accepts `javascript:`, `data:`, `file:`, etc.
**Prevention:** Explicitly validate `url.protocol` against an allowlist (e.g., `http:`, `https:`) when accepting URL inputs.

## 2025-05-24 - Latent Vulnerability in Dead Code
**Vulnerability:** An unused validation library (`InputValidation.jsx`) contained an insecure URL validator allowing `javascript:` protocol.
**Learning:** Unused code (dead code) creates a false sense of security and can be a "time bomb" if later adopted by developers assuming it is safe.
**Prevention:** Regularly audit codebase for unused files and remove them. If code must be kept, ensure it meets current security standards even if not currently active.
