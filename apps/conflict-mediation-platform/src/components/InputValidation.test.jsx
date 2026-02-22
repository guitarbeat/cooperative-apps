import { describe, it, expect } from "vitest";
import { validationRules } from "./InputValidation";

describe("InputValidation Rules", () => {
  describe("url validation", () => {
    it("should allow valid http URLs", () => {
      const rule = validationRules.url();
      const result = rule.validate("http://example.com");
      expect(result.isValid).toBe(true);
    });

    it("should allow valid https URLs", () => {
      const rule = validationRules.url();
      const result = rule.validate("https://example.com");
      expect(result.isValid).toBe(true);
    });

    it("should reject invalid URLs", () => {
      const rule = validationRules.url();
      const result = rule.validate("not-a-url");
      expect(result.isValid).toBe(false);
    });

    it("should reject javascript: URLs (VULNERABILITY CHECK)", () => {
      const rule = validationRules.url();
      const result = rule.validate("javascript:alert(1)");
      expect(result.isValid).toBe(false); // This should fail before the fix
    });
  });
});
