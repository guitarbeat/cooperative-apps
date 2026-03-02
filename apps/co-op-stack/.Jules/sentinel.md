## 2026-01-19 - Hardcoded Supabase Credentials
**Vulnerability:** Hardcoded `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `src/integrations/supabase/client.ts`.
**Learning:** Hardcoding secrets, even "safe" ones like anon keys, complicates environment management and violates the "Store config in the environment" factor of 12-Factor App. It also risks exposing keys if they are committed to public repositories.
**Prevention:** Use `import.meta.env` for all configuration variables. Implement runtime checks to fail fast if required environment variables are missing.

## 2026-05-24 - Weak Random Number Generation in Meeting Codes
**Vulnerability:** Use of `Math.random()` for generating meeting codes in both Supabase and P2P services.
**Learning:** `Math.random()` is not cryptographically secure and can be predictable. Meeting codes act as access tokens, so predictability allows potential unauthorized access (zoombombing). Even for short, temporary codes, using `crypto.getRandomValues()` is a low-cost, high-value security practice.
**Prevention:** Always use `crypto.getRandomValues()` (or a wrapper like `generateSecureRandomString`) for any value that grants access or requires unpredictability, not just "secrets".

## 2026-06-25 - Missing Input Validation in Meeting Services
**Vulnerability:** `SupabaseMeetingService` methods accepted raw strings for sensitive fields (name, title) without validation, relying solely on UI-side checks.
**Learning:** Defense in Depth is crucial. UI validation can be bypassed. Service-layer validation using shared schemas (Zod) ensures data integrity regardless of the entry point. Also, regex validation for names must support unicode property escapes (`\p{L}`) to be inclusive of international users while blocking dangerous characters.
**Prevention:** Implement a reusable `validate<T>(schema, value, errorCode)` helper in service classes and enforce it at the start of every public method. Use `zod` schemas shared between UI and services.
