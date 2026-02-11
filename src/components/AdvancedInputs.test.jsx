import { describe, it, expect, vi, afterEach } from "vitest";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MultiSelectInput } from "./AdvancedInputs";

afterEach(() => {
  cleanup();
});

describe("MultiSelectInput", () => {
  it("renders with correct label and initial state", () => {
describe("MultiSelectInput Accessibility", () => {
  it("focuses trigger when label is clicked", () => {
    render(
      <MultiSelectInput
        id="test-input"
        label="Test Label"
        options={["Option 1", "Option 2"]}
        value={[]}
        onChange={() => {}}
      />
    );

    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.getByText("Select options...")).toBeInTheDocument();
  });

  it("is accessible via keyboard", () => {
    const handleChange = vi.fn();
    render(
      <MultiSelectInput
        id="test-keyboard"
        label="Keyboard Test"
        placeholder="Choose something..."
        options={["Option A", "Option B"]}
        onChange={handleChange}
      />
    );

    // Find the trigger element by unique placeholder
    const placeholder = screen.getByText("Choose something...");
    const trigger = placeholder.closest(".form-input");

    // Check accessibility attributes (expecting these to exist after fix)
    expect(trigger).toHaveAttribute("tabIndex", "0");
    expect(trigger).toHaveAttribute("role", "combobox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");

    // Test keyboard interaction
    fireEvent.keyDown(trigger, { key: "Enter" });

    // Should be expanded now
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // Dropdown should be visible (it has a search input inside)
    expect(screen.getByPlaceholderText("Search options...")).toBeInTheDocument();

    // Close with Escape
    fireEvent.keyDown(screen.getByPlaceholderText("Search options..."), { key: "Escape" });

    // Should be closed
    // Re-query trigger attributes
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    const label = screen.getByText("Test Label");
    fireEvent.click(label);

    const trigger = screen.getByText("Select options...").closest(".form-input");

    // Expect failure here currently
    expect(document.activeElement).toBe(trigger);
  });

  it("is reachable via keyboard", () => {
    render(
      <MultiSelectInput
        id="test-input"
        label="Test Label"
        value={[]}
        onChange={() => {}}
      />
    );

    const trigger = screen.getByText("Select options...").closest(".form-input");
    // Expect failure here currently
    expect(trigger).toHaveAttribute("tabindex", "0");
  });

  it("opens on Enter key", () => {
    render(
      <MultiSelectInput
        id="test-input"
        label="Test Label"
        value={[]}
        onChange={() => {}}
        options={["Option 1"]}
      />
    );

    const trigger = screen.getByText("Select options...").closest(".form-input");
    fireEvent.keyDown(trigger, { key: "Enter" });

    // Expect failure here currently
    expect(screen.getByPlaceholderText("Search options...")).toBeInTheDocument();
  });

  it("closes on Escape key and returns focus to trigger", () => {
    render(
      <MultiSelectInput
        id="test-input"
        label="Test Label"
        value={[]}
        onChange={() => {}}
        options={["Option 1"]}
      />
    );

    const trigger = screen.getByText("Select options...").closest(".form-input");

    // Open it first (click works currently)
    fireEvent.click(trigger);
    const searchInput = screen.getByPlaceholderText("Search options...");
    expect(searchInput).toBeInTheDocument();

    searchInput.focus();

    // Press Escape
    fireEvent.keyDown(searchInput, { key: "Escape" });

    expect(screen.queryByPlaceholderText("Search options...")).not.toBeInTheDocument();

    // Expect failure here currently (focus return)
    expect(document.activeElement).toBe(trigger);
  });
});
