import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ParticipantList } from "../ParticipantList";
import type { Participant } from "@/types/meeting";

// Mock EditableField to simplify testing and avoid testing implementation details of child
vi.mock("@/components/ui/editable-field", () => ({
  EditableField: ({ value, onUpdate, canEdit }: any) => (
    <div data-testid="editable-field">
      <span>{value}</span>
      {canEdit && (
        <button
          onClick={() => onUpdate(value + " updated")}
          data-testid={`edit-btn-${value}`}
        >
          Edit
        </button>
      )}
    </div>
  ),
}));

describe("ParticipantList", () => {
  const mockParticipants: Participant[] = [
    {
      id: "1",
      name: "Alice",
      isFacilitator: true,
      hasRaisedHand: false,
      joinedAt: new Date().toISOString(),
      isActive: true,
    },
    {
      id: "2",
      name: "Bob",
      isFacilitator: false,
      hasRaisedHand: true,
      joinedAt: new Date().toISOString(),
      isActive: true,
    },
  ];

  const mockOnUpdate = vi.fn();
  const mockOnRemove = vi.fn();

  it("renders participants correctly", () => {
    render(
      <ParticipantList
        participants={mockParticipants}
        onUpdateParticipant={mockOnUpdate}
        onRemoveParticipant={mockOnRemove}
        userRole="participant"
      />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Participants (2)")).toBeInTheDocument();
  });

  it("allows facilitator to remove participants", () => {
    render(
      <ParticipantList
        participants={mockParticipants}
        onUpdateParticipant={mockOnUpdate}
        onRemoveParticipant={mockOnRemove}
        userRole="facilitator"
      />
    );

    // Alice is facilitator, Bob is not. Alice (user) can remove Bob.
    // Wait, the component checks userRole="facilitator".
    // And it renders delete button if `isFacilitator && !participant.isFacilitator`.

    // Find remove button for Bob.
    // The button has aria-label="Remove Bob"
    const removeBtn = screen.getByLabelText("Remove Bob");
    expect(removeBtn).toBeInTheDocument();

    fireEvent.click(removeBtn);
    expect(mockOnRemove).toHaveBeenCalledWith("2");
  });

  it("does not show remove button for non-facilitators", () => {
    render(
      <ParticipantList
        participants={mockParticipants}
        onUpdateParticipant={mockOnUpdate}
        onRemoveParticipant={mockOnRemove}
        userRole="participant"
      />
    );

    const removeBtn = screen.queryByLabelText("Remove Bob");
    expect(removeBtn).not.toBeInTheDocument();
  });

  it("calls onUpdateParticipant when name is edited", () => {
    render(
      <ParticipantList
        participants={mockParticipants}
        onUpdateParticipant={mockOnUpdate}
        onRemoveParticipant={mockOnRemove}
        userRole="facilitator"
      />
    );

    // Interact with mocked EditableField
    const editBtn = screen.getByTestId("edit-btn-Alice");
    fireEvent.click(editBtn);

    expect(mockOnUpdate).toHaveBeenCalledWith("1", "Alice updated");
  });
});
