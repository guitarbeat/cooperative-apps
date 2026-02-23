## 2025-02-18 - CSS Injection in ChartStyle
**Vulnerability:** Found unsanitized user input being injected into a <style> tag via dangerouslySetInnerHTML in a Chart component.
**Learning:** Even UI libraries (like shadcn/ui or Recharts wrappers) can introduce XSS vectors if they interpolate props directly into style tags. React's default escaping does not apply to dangerouslySetInnerHTML.
**Prevention:** Always sanitize dynamic values injected into <style> blocks, removing characters like <, >, {, }, ; to prevent breaking out of the context.

## 2025-05-23 - URL Input Validation
**Vulnerability:** Input fields of type `url` allowed `javascript:` and other potentially dangerous protocols because `new URL()` validation only checks for valid URL syntax, not safe protocols.
**Learning:** `new URL()` is not sufficient for security validation of user-provided URLs. It accepts `javascript:`, `data:`, `file:`, etc.
**Prevention:** Explicitly validate `url.protocol` against an allowlist (e.g., `http:`, `https:`) when accepting URL inputs.

## 2025-05-24 - Content Security Policy (CSP) Missing
**Vulnerability:** The `houselove` app and its training tools lacked a Content Security Policy, making them vulnerable to XSS and data injection attacks.
**Learning:** Static HTML files and CRA apps do not include CSP by default. Always explicitly add a CSP meta tag to all HTML entry points.
**Prevention:** Audit all `index.html` files and ensure a restrictive CSP is present.
