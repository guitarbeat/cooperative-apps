## 2025-02-18 - CSS Injection in ChartStyle
**Vulnerability:** Found unsanitized user input being injected into a <style> tag via dangerouslySetInnerHTML in a Chart component.
**Learning:** Even UI libraries (like shadcn/ui or Recharts wrappers) can introduce XSS vectors if they interpolate props directly into style tags. React's default escaping does not apply to dangerouslySetInnerHTML.
**Prevention:** Always sanitize dynamic values injected into <style> blocks, removing characters like <, >, {, }, ; to prevent breaking out of the context.
