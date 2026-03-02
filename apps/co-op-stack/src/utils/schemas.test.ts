import { describe, it, expect } from "vitest";
import { nameSchema } from "./schemas";

describe("nameSchema", () => {
  it("validates valid names", () => {
    const validNames = [
      "John Doe",
      "Jules-Agent",
      "O'Connor",
      "Jürgen",
      "José",
      "Åsa",
      "日本語", // Japanese
      "中文", // Chinese
      "Русский", // Russian
      "العربية", // Arabic (if \p{L} works correctly)
    ];

    validNames.forEach((name) => {
      const result = nameSchema.safeParse(name);
      expect(result.success, `Expected "${name}" to be valid`).toBe(true);
    });
  });

  it("rejects invalid names", () => {
    const invalidNames = [
      "Invalid@Name",
      "<script>",
      "Name!",
      "", // Too short (min 1)
      "a".repeat(51), // Too long
    ];

    invalidNames.forEach((name) => {
      const result = nameSchema.safeParse(name);
      expect(result.success, `Expected "${name}" to be invalid`).toBe(false);
    });
  });
});
