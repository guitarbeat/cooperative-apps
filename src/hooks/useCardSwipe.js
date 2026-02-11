import { useState } from "react";

// Constants
const MIN_SWIPE_DISTANCE = 50;
const MAX_DRAG_OFFSET = 200;

export const useCardSwipe = ({
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
}) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  /**
   * Get client X coordinate from touch or mouse event
   * @param {Event} e - Touch or mouse event
   * @returns {number} Client X coordinate
   */
  const getClientX = (e) => {
    return e.touches ? e.touches[0].clientX : e.clientX;
  };

  const getClientY = (e) => {
    return e.touches ? e.touches[0].clientY : e.clientY;
  };

  /**
   * Handle input start (touch/mouse down)
   * @param {Event} e - Touch or mouse event
   */
  const handleInputStart = (e) => {
    if (disabled) return;

    // Check if the drag started on an interactive element
    const target = e.target;

    // Logic from useNavigation to ignore form elements
    const isFormElement = target.closest(
        "input, textarea, button, select, label, [role='button'], [role='tab'], [contenteditable], .form-field, .form-input, .form-textarea"
    );
    const isBadgeElement = target.closest('.badge, [class*="badge"], [data-slot="badge"]');
    const isEmojiElement = target.closest(
        '[data-interactive-component="emoji-mapper"]'
    );
    const isClickableElement = target.closest(
        "a, button, [onclick], [data-clickable]"
    );
    const isProgressElement = target.closest(
        '[class*="progress"], [class*="step"]'
    );

    if (
        isFormElement ||
        isBadgeElement ||
        isEmojiElement ||
        isClickableElement ||
        isProgressElement
    ) {
        return;
    }

    if (e.cancelable) e.preventDefault();

    setIsDragging(true);
    setTouchEnd(null);
    setTouchStart(getClientX(e));
    setTouchStartY(getClientY(e));
    setDragOffset(0);
  };

  /**
   * Handle input move (touch/mouse move)
   * @param {Event} e - Touch or mouse event
   */
  const handleInputMove = (e) => {
    if (!touchStart || disabled || !isDragging) return;

    const currentX = getClientX(e);
    const currentY = getClientY(e);
    setTouchEnd(currentX);

    const offset = currentX - touchStart;
    const verticalOffset =
        typeof touchStartY === "number" && typeof currentY === "number"
            ? currentY - touchStartY
            : 0;

    if (
        e.cancelable &&
        e.touches &&
        Math.abs(offset) > Math.abs(verticalOffset)
    ) {
        e.preventDefault();
    }
    const clampedOffset = Math.max(-MAX_DRAG_OFFSET, Math.min(50, offset));
    setDragOffset(clampedOffset);
  };

  /**
   * Handle input end (touch/mouse up)
   */
  const handleInputEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    if (!touchStart || !touchEnd || disabled) {
        setDragOffset(0);
        setTouchStart(null);
        setTouchStartY(null);
        setTouchEnd(null);
        return;
    }

    const swipeDistance = touchStart - touchEnd;
    const isLeftSwipe = swipeDistance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = swipeDistance < -MIN_SWIPE_DISTANCE;

    if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft();
    } else if (isRightSwipe && onSwipeRight) {
        onSwipeRight();
    }

    setDragOffset(0);
    setTouchStart(null);
    setTouchStartY(null);
    setTouchEnd(null);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
        setIsDragging(false);
        setDragOffset(0);
        setTouchStart(null);
        setTouchStartY(null);
        setTouchEnd(null);
    }
  };

  return {
    dragOffset,
    isDragging,
    handlers: {
      handleInputStart,
      handleInputMove,
      handleInputEnd,
      handleMouseLeave
    }
  };
};
