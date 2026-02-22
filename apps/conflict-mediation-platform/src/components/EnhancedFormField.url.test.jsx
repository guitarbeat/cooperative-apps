import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import EnhancedFormField from "./EnhancedFormField";

afterEach(() => {
  cleanup();
});

describe("EnhancedFormField URL Validation", () => {
  it("allows valid http URLs", async () => {
    const handleChange = vi.fn();
    render(
      <EnhancedFormField
        id="url-valid"
        label="URL"
        value=""
        type="url"
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText("URL");
    fireEvent.change(input, { target: { value: "http://example.com" } });

    // Wait for debounce/validation
    await waitFor(() => expect(screen.queryByText(/valid URL/)).not.toBeInTheDocument(), { timeout: 1000 });
  });

  it("allows valid https URLs", async () => {
    const handleChange = vi.fn();
    render(
      <EnhancedFormField
        id="url-valid-https"
        label="URL"
        value=""
        type="url"
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText("URL");
    fireEvent.change(input, { target: { value: "https://example.com" } });

    // Wait for debounce/validation
    await waitFor(() => expect(screen.queryByText(/valid URL/)).not.toBeInTheDocument(), { timeout: 1000 });
  });

  it("rejects javascript: URLs (VULNERABILITY CHECK)", async () => {
    const handleChange = vi.fn();
    render(
      <EnhancedFormField
        id="url-js"
        label="URL"
        value=""
        type="url"
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText("URL");
    fireEvent.change(input, { target: { value: "javascript:alert(1)" } });

    // This should fail until the fix is implemented because currently javascript: URLs are considered valid by new URL()
    await screen.findByText("URL must start with http:// or https://");
  });
});
