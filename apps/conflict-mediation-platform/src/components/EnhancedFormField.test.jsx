import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import EnhancedFormField from "./EnhancedFormField";

afterEach(() => {
  cleanup();
});

describe("EnhancedFormField Character Count", () => {
  it("renders correctly with showCharacterCount", () => {
    render(
      <EnhancedFormField
        id="test-input"
        label="Test Label"
        value="Hello"
        showCharacterCount={true}
        maxLength={10}
        onChange={() => {}}
      />
    );

    const counter = screen.getByText("5/10");
    expect(counter).toBeInTheDocument();
  });

  it("applies orange color when approaching limit (>90%)", () => {
    // 19 chars / 20 limit = 95% > 90%
    const value = "a".repeat(19);
    render(
      <EnhancedFormField
        id="test-limit"
        label="Limit Test"
        value={value}
        showCharacterCount={true}
        maxLength={20}
        onChange={() => {}}
      />
    );

    const counter = screen.getByText("19/20");
    // Check if orange class is present.
    // Note: If both orange and red are applied, verification depends on how `cn` merges.
    // But here only orange condition is true (19 < 20).
    expect(counter).toHaveClass("text-orange-500");
    expect(counter).not.toHaveClass("text-red-500");
    expect(counter).not.toHaveClass("animate-shake");
  });

  it("applies red color and animate-shake when limit reached (100%)", () => {
    // 20 chars / 20 limit = 100%
    const value = "a".repeat(20);
    render(
      <EnhancedFormField
        id="test-shake"
        label="Shake Test"
        value={value}
        showCharacterCount={true}
        maxLength={20}
        onChange={() => {}}
      />
    );

    const counter = screen.getByText("20/20");
    // At 100%, both conditions (length > 90% and length >= 100%) are true.
    // However, text-red-500 should supersede text-orange-500 if using tailwind-merge correctly.
    // But JSDOM checks strictly for class presence in the DOM element classList.
    // EnhancedFormField uses `cn` which likely uses tailwind-merge.
    // So `text-orange-500` might be removed if it conflicts with `text-red-500`.
    // Let's check for red and shake.
    expect(counter).toHaveClass("text-red-500");
    expect(counter).toHaveClass("animate-shake");
  });
});
