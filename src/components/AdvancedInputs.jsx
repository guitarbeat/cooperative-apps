import React, { useState, useRef, useEffect, useId } from "react";
import { Plus, X, Check, ChevronDown, Star, Heart, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "../lib/utils";

// Multi-select input for selecting multiple options
export const MultiSelectInput = ({
  id,
  label,
  placeholder = "Select options...",
  value = [],
  onChange,
  options = [],
  maxSelections,
  allowCustom = false,
  error = "",
  required = false,
  description = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customValue, setCustomValue] = useState("");
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const listboxId = useId();

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !value.includes(option)
  );

  const handleSelect = (option) => {
    if (maxSelections && value.length >= maxSelections) return;
    onChange([...value, option]);
    setSearchTerm("");
  };

  const handleRemove = (option) => {
    onChange(value.filter(item => item !== option));
  };

  const handleAddCustom = () => {
    if (customValue.trim() && !value.includes(customValue.trim())) {
      handleSelect(customValue.trim());
      setCustomValue("");
    }
  };

  const handleTriggerKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && allowCustom && customValue.trim()) {
      e.preventDefault();
      handleAddCustom();
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      setIsOpen(false);
      // Return focus to trigger when closing
      dropdownRef.current?.querySelector('[role="combobox"]')?.focus();
    }
  };

  const handleTriggerKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
      triggerRef.current?.focus();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="form-field space-y-2">
      <label
        htmlFor={id}
        className={cn("form-label", required && "after:content-['*'] after:text-red-500 after:ml-1")}
        onClick={() => triggerRef.current?.focus()}
      >
        {label}
      </label>
      {description && <p className="form-description text-sm text-muted-foreground">{description}</p>}
      
      <div className="relative" ref={dropdownRef}>
        <div
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={id ? `${id}-listbox` : undefined}
          tabIndex={0}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            "form-input w-full min-h-[2.5rem] flex flex-wrap items-center gap-1 p-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary",
          ref={triggerRef}
          id={id}
          tabIndex={0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          className={cn(
            "form-input w-full min-h-[2.5rem] flex flex-wrap items-center gap-1 p-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            isOpen && "ring-2 ring-primary/20"
          )}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleTriggerKeyDown}
        >
          {value.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            value.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
              >
                {item}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item);
                  }}
                  className="hover:text-primary/70"
                  aria-label={`Remove ${item}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground ml-auto transition-transform", isOpen && "rotate-180")}
            aria-hidden="true"
          />
        </div>

        {isOpen && (
          <div
            id={id ? `${id}-listbox` : undefined}
            role="listbox"
            className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
            id={listboxId}
            className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
            role="listbox"
          >
            <div className="p-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="form-input w-full text-sm"
                autoFocus
              />
            </div>
            
            {filteredOptions.length > 0 && (
              <div className="max-h-40 overflow-auto">
                {filteredOptions.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm"
                    onClick={() => handleSelect(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {allowCustom && (
              <div className="p-2 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom option..."
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="form-input flex-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    disabled={!customValue.trim()}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Add custom option"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {filteredOptions.length === 0 && !allowCustom && (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                No options found
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-xs flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
};

// Rating scale input
export const RatingInput = ({
  id,
  label,
  value = 0,
  onChange,
  max = 5,
  type = "star", // star, heart, thumbs, number
  size = "md",
  error = "",
  required = false,
  description = "",
  labels = [],
}) => {
  const [hoveredValue, setHoveredValue] = useState(0);

  const getIcon = (type, filled) => {
    const iconProps = {
      className: cn(
        "transition-colors cursor-pointer",
        size === "sm" && "h-4 w-4",
        size === "md" && "h-5 w-5",
        size === "lg" && "h-6 w-6",
        filled ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-400"
      )
    };

    switch (type) {
      case "star":
        return <Star {...iconProps} fill={filled ? "currentColor" : "none"} />;
      case "heart":
        return <Heart {...iconProps} fill={filled ? "currentColor" : "none"} />;
      case "thumbs":
        return filled ? <ThumbsUp {...iconProps} /> : <ThumbsDown {...iconProps} />;
      default:
        return <div className={cn("rounded-full border-2", filled ? "bg-primary border-primary" : "border-muted-foreground", iconProps.className)} />;
    }
  };

  const handleClick = (rating) => {
    onChange(rating);
  };

  const handleMouseEnter = (rating) => {
    setHoveredValue(rating);
  };

  const handleMouseLeave = () => {
    setHoveredValue(0);
  };

  return (
    <div className="form-field space-y-2">
      <label htmlFor={id} className={cn("form-label", required && "after:content-['*'] after:text-red-500 after:ml-1")}>
        {label}
      </label>
      {description && <p className="form-description text-sm text-muted-foreground">{description}</p>}
      
      <div className="flex items-center gap-1">
        {Array.from({ length: max }, (_, index) => {
          const rating = index + 1;
          const isFilled = rating <= (hoveredValue || value);
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              className="p-1 hover:scale-110 transition-transform"
              aria-label={`Rate ${rating} out of ${max}`}
              aria-pressed={value === rating}
            >
              {getIcon(type, isFilled)}
            </button>
          );
        })}
        
        {type === "number" && (
          <span className="ml-2 text-sm text-muted-foreground">
            {value}/{max}
          </span>
        )}
      </div>

      {labels.length > 0 && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {labels.map((label, index) => (
            <span key={index} className="text-center flex-1">
              {label}
            </span>
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-600 text-xs flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
};

// Structured list input for action steps, solutions, etc.
export const StructuredListInput = ({
  id,
  label,
  value = [],
  onChange,
  itemPlaceholder = "Enter item...",
  maxItems,
  error = "",
  required = false,
  description = "",
  itemType = "text", // text, textarea
  containerClassName = "",
  containerStyle = {},
  containerProps = {},
  labelClassName = "",
}) => {
  const [newItem, setNewItem] = useState("");
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editingValue, setEditingValue] = useState("");

  const handleAdd = () => {
    if (newItem.trim() && (!maxItems || value.length < maxItems)) {
      onChange([...value, { id: Date.now(), text: newItem.trim(), completed: false }]);
      setNewItem("");
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditingValue(value[index].text);
  };

  const handleSaveEdit = () => {
    if (editingValue.trim()) {
      const updated = [...value];
      updated[editingIndex] = { ...updated[editingIndex], text: editingValue.trim() };
      onChange(updated);
    }
    setEditingIndex(-1);
    setEditingValue("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
    setEditingValue("");
  };

  const handleDelete = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleToggleComplete = (index) => {
    const updated = [...value];
    updated[index] = { ...updated[index], completed: !updated[index].completed };
    onChange(updated);
  };

  // const handleReorder = (fromIndex, toIndex) => {
  //   const updated = [...value];
  //   const [movedItem] = updated.splice(fromIndex, 1);
  //   updated.splice(toIndex, 0, movedItem);
  //   onChange(updated);
  // };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editingIndex >= 0) {
        handleSaveEdit();
      } else {
        handleAdd();
      }
    }
    if (e.key === "Escape") {
      if (editingIndex >= 0) {
        handleCancelEdit();
      }
    }
  };

  return (
    <div
      className={cn("form-field space-y-2", containerClassName)}
      style={containerStyle}
      {...containerProps}
    >
      <label
        htmlFor={id}
        className={cn(
          "form-label",
          required && "after:content-['*'] after:text-red-500 after:ml-1",
          labelClassName,
        )}
      >
        {label}
      </label>
      {description && <p className="form-description text-sm text-muted-foreground">{description}</p>}
      
      <div className="space-y-2">
        {/* Add new item */}
        <div className="flex gap-2">
          {itemType === "textarea" ? (
            <textarea
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={itemPlaceholder}
              rows={2}
              className="form-input flex-1 resize-none"
            />
          ) : (
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={itemPlaceholder}
              className="form-input flex-1"
            />
          )}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newItem.trim() || (maxItems && value.length >= maxItems)}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Add item"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Items list */}
        <div className="space-y-2">
          {value.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-2 p-2 border border-border rounded-md",
                item.completed && "opacity-60 bg-muted/50"
              )}
            >
              <button
                type="button"
                onClick={() => handleToggleComplete(index)}
                className="mt-1 text-muted-foreground hover:text-primary transition-colors"
                aria-label={item.completed ? "Mark as incomplete" : "Mark as complete"}
              >
                <Check className={cn("h-4 w-4", item.completed && "text-green-500")} />
              </button>

              {editingIndex === index ? (
                <div className="flex-1 flex gap-2">
                  {itemType === "textarea" ? (
                    <textarea
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={2}
                      className="form-input flex-1 resize-none"
                      autoFocus
                    />
                  ) : (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="form-input flex-1"
                      autoFocus
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="px-2 py-1 bg-green-500 text-white rounded text-sm"
                    aria-label="Save item"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                    aria-label="Cancel edit"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className={cn("text-sm", item.completed && "line-through")}>
                      {item.text}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(index)}
                      className="p-1 text-muted-foreground hover:text-primary transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(index)}
                      className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                      aria-label="Delete item"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {maxItems && (
          <p className="text-xs text-muted-foreground">
            {value.length}/{maxItems} items
          </p>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-xs flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
};

// Priority selector
export const PriorityInput = ({
  id,
  label,
  value = "medium",
  onChange,
  error = "",
  required = false,
  description = "",
}) => {
  const priorities = [
    { value: "low", label: "Low", color: "text-green-600", bg: "bg-green-100" },
    { value: "medium", label: "Medium", color: "text-yellow-600", bg: "bg-yellow-100" },
    { value: "high", label: "High", color: "text-orange-600", bg: "bg-orange-100" },
    { value: "urgent", label: "Urgent", color: "text-red-600", bg: "bg-red-100" },
  ];

  return (
    <div className="form-field space-y-2">
      <label htmlFor={id} className={cn("form-label", required && "after:content-['*'] after:text-red-500 after:ml-1")}>
        {label}
      </label>
      {description && <p className="form-description text-sm text-muted-foreground">{description}</p>}
      
      <div className="grid grid-cols-2 gap-2">
        {priorities.map((priority) => (
          <button
            key={priority.value}
            type="button"
            onClick={() => onChange(priority.value)}
            className={cn(
              "p-3 rounded-md border-2 transition-all text-sm font-medium",
              value === priority.value
                ? `border-current ${priority.color} ${priority.bg}`
                : "border-border hover:border-muted-foreground"
            )}
            aria-pressed={value === priority.value}
          >
            {priority.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-red-600 text-xs flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
};