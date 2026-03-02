import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EditableField } from "../editable-field";

describe("EditableField", () => {
  const mockOnUpdate = vi.fn();

  it("renders initial value", () => {
    render(
      <EditableField
        value="Initial Value"
        onUpdate={mockOnUpdate}
        canEdit={false}
      />
    );

    expect(screen.getByText("Initial Value")).toBeInTheDocument();
    // Edit button should not be visible when canEdit is false
    expect(screen.queryByLabelText("Edit")).not.toBeInTheDocument();
  });

  it("switches to edit mode on button click", async () => {
    render(
      <EditableField
        value="Initial Value"
        onUpdate={mockOnUpdate}
        canEdit={true}
      />
    );

    const editButton = screen.getByLabelText("Edit");
    fireEvent.click(editButton);

    const input = screen.getByDisplayValue("Initial Value");
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();

    const saveButton = screen.getByLabelText("Save");
    const cancelButton = screen.getByLabelText("Cancel");
    expect(saveButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
  });

  it("calls onUpdate with new value when saved", async () => {
    render(
      <EditableField
        value="Initial Value"
        onUpdate={mockOnUpdate}
        canEdit={true}
      />
    );

    fireEvent.click(screen.getByLabelText("Edit"));

    const input = screen.getByDisplayValue("Initial Value");
    fireEvent.change(input, { target: { value: "New Value" } });

    const saveButton = screen.getByLabelText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith("New Value");
    });
  });

  it("shows loading state while onUpdate is pending", async () => {
    let resolveUpdate: (value: void | PromiseLike<void>) => void;
    const delayedUpdate = new Promise<void>((resolve) => {
      resolveUpdate = resolve;
    });
    const mockAsyncUpdate = vi.fn().mockReturnValue(delayedUpdate);

    render(
      <EditableField
        value="Initial Value"
        onUpdate={mockAsyncUpdate}
        canEdit={true}
      />
    );

    fireEvent.click(screen.getByLabelText("Edit"));
    const input = screen.getByDisplayValue("Initial Value");
    fireEvent.change(input, { target: { value: "Updated Value" } });

    const saveButton = screen.getByLabelText("Save");
    fireEvent.click(saveButton);

    // Should be disabled while updating
    expect(saveButton).toBeDisabled();
    expect(input).toBeDisabled();

    // Should show spinner
    const spinner = saveButton.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();

    // Resolve the update
    // @ts-expect-error - resolveUpdate is assigned inside the promise callback
    // @ts-expect-error - mock function
    resolveUpdate();

    await waitFor(() => {
      expect(input).not.toBeInTheDocument();
      expect(screen.getByText("Initial Value")).toBeInTheDocument(); // It resets to value prop, which hasn't changed here because we mocked onUpdate
    });
  });

  it("resets value if onUpdate fails", async () => {
    const mockErrorUpdate = vi.fn().mockRejectedValue(new Error("Update failed"));

    render(
      <EditableField
        value="Initial Value"
        onUpdate={mockErrorUpdate}
        canEdit={true}
      />
    );

    fireEvent.click(screen.getByLabelText("Edit"));
    const input = screen.getByDisplayValue("Initial Value");
    fireEvent.change(input, { target: { value: "Failed Update" } });

    const saveButton = screen.getByLabelText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockErrorUpdate).toHaveBeenCalled();
      // Should switch back to view mode and show original value (or stay in edit mode?)
      // The current implementation resets to view mode on success, but on error it just resets editValue to value.
      // Wait, let's check implementation:
      /*
        } catch (error) {
          // ...
          // Reset to original value on error
          setEditValue(value);
        } finally {
          setIsUpdating(false);
        }
      */
      // It stays in edit mode! But value is reset.
      expect(screen.getByDisplayValue("Initial Value")).toBeInTheDocument();
    });
  });

  it("uses aria-label from placeholder or default", async () => {
    render(
      <EditableField
        value="Value"
        onUpdate={mockOnUpdate}
        canEdit={true}
        placeholder="Custom Placeholder"
      />
    );

    fireEvent.click(screen.getByLabelText("Edit"));

    const input = screen.getByPlaceholderText("Custom Placeholder");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-label", "Custom Placeholder");
  });
});
