import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
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
    expect(counter).toHaveClass("text-orange-500");
    expect(counter).not.toHaveClass("text-red-500");
    expect(counter).not.toHaveClass("animate-shake");
  });

  it("applies red color and animate-shake when limit reached (100%)", () => {
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
    expect(counter).toHaveClass("text-red-500");
    expect(counter).toHaveClass("animate-shake");
  });
});

describe("EnhancedFormField Validation and Sanitization", () => {
  it("validates email format", async () => {
    const handleChange = vi.fn();
    render(
      <EnhancedFormField
        id="email-test"
        label="Email"
        value=""
        type="email"
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText("Email");

    // Simulate typing
    fireEvent.change(input, { target: { value: "invalid-email" } });

    // Use findByText which waits automatically
    const errorMessage = await screen.findByText("Please enter a valid email address");
    expect(errorMessage).toBeInTheDocument();
  });

  it("trims whitespace on blur", async () => {
    const handleChange = vi.fn();
    render(
      <EnhancedFormField
        id="trim-test"
        label="Trim Test"
        value="  test  "
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText("Trim Test");
    fireEvent.blur(input);

    expect(handleChange).toHaveBeenCalledWith("test");
  });
});
