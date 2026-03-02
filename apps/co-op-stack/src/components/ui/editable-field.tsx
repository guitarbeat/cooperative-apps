import {
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Check, X, Loader2 } from "lucide-react";
import { logProduction } from "@/utils/productionLogger";

interface EditableFieldProps<T = string> {
  value: T;
  onUpdate: (newValue: T) => Promise<void> | void;
  canEdit: boolean;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
  placeholder?: string;
  displayValue?: (value: T) => ReactNode;
  inputClassName?: string;
}

export function EditableField<T extends string = string>({
  value,
  onUpdate,
  canEdit,
  disabled = false,
  className = "",
  maxLength = 100,
  placeholder,
  displayValue,
  inputClassName = "h-8 text-sm",
}: EditableFieldProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStartEdit = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (isUpdating) return;

    if (editValue.trim() === value || editValue.trim() === "") {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      const result = onUpdate(editValue.trim() as T);
      if (result && typeof result.then === "function") {
        await result;
      }
      setIsEditing(false);
    } catch (error) {
      logProduction("error", {
        action: "update_field_value",
        value: editValue,
        error: error instanceof Error ? error.message : String(error),
      });
      // Reset to original value on error
      setEditValue(value);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  if (!canEdit || disabled) {
    return (
      <span className={className}>
        {displayValue ? displayValue(value) : value}
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={editValue}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setEditValue(event.target.value as T)
          }
          onKeyDown={handleKeyDown}
          className={inputClassName}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={placeholder || "Edit value"}
          autoFocus
          disabled={isUpdating}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            void handleSaveEdit();
          }}
          disabled={isUpdating || editValue.trim() === ""}
          className="h-8 w-8 p-0"
          aria-label="Save"
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4 text-green-600" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancelEdit}
          disabled={isUpdating}
          className="h-8 w-8 p-0"
          aria-label="Cancel"
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className={className}>
        {displayValue ? displayValue(value) : value}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleStartEdit}
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        aria-label="Edit"
      >
        <Edit2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
