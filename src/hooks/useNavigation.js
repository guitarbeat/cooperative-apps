import { useEffect, useRef, useState, useCallback } from "react";

// Constants
const MIN_SWIPE_DISTANCE = 50;
const MAX_DRAG_OFFSET = 200;

// Helper functions
const getClientX = (e) => {
    return e.touches ? e.touches[0].clientX : e.clientX;
};

const getClientY = (e) => {
    return e.touches ? e.touches[0].clientY : e.clientY;
};

/**
 * Custom hook for managing step navigation and card animations
 * @param {Object} options
 * @param {(params: { currentStep: number, targetStep: number, direction: "forward"|"backward"|"none", type: "direct"|"step" }) => boolean} [options.canNavigateToStep]
 * Callback invoked before navigation. Return false to prevent the transition.
 * @param {number} [options.totalSteps=7] - Total number of steps available in the flow.
 * @param {number} [options.animationDuration=400] - Duration of card transition animations in milliseconds.
 * @returns {Object} Navigation state and functions
 */
export const useNavigation = (options = {}) => {
    const {
        canNavigateToStep,
        totalSteps = 7,
        animationDuration = 400,
    } = options;
    const [currentStep, setCurrentStep] = useState(1);
    const [animatingCard, setAnimatingCard] = useState(null);
    const [animationType, setAnimationType] = useState("");
    const animationTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
                animationTimeoutRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        setCurrentStep((prev) => {
            if (!Number.isFinite(totalSteps) || totalSteps <= 0) {
                return Math.max(1, prev);
            }
            return Math.max(1, Math.min(totalSteps, prev));
        });
    }, [totalSteps]);

    // Computed values
    const isAnimating = animatingCard !== null;

    const shouldNavigate = useCallback((targetStep, meta = {}) => {
        if (typeof canNavigateToStep === "function") {
            return canNavigateToStep({
                currentStep,
                targetStep,
                ...meta,
            });
        }
        return true;
    }, [canNavigateToStep, currentStep]);

    const resetAnimationState = useCallback(() => {
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
            animationTimeoutRef.current = null;
        }
        setAnimatingCard(null);
        setAnimationType("");
    };
        setDragOffset(0);
    }, []);

    /**
     * Navigate to the next or previous step
     * @param {string|number} target - 'next', 'prev', or a direct step number
     */
    const navigateToStep = useCallback((target) => {
        if (isAnimating) return;

        if (typeof target === "number") {
            const clampedTarget = Math.max(1, Math.min(totalSteps, target));

            if (clampedTarget === currentStep) {
                return;
            }

            const direction =
                clampedTarget > currentStep
                    ? "forward"
                    : clampedTarget < currentStep
                    ? "backward"
                    : "none";

            if (!shouldNavigate(clampedTarget, { type: "direct", direction })) {
                return;
            }

            resetAnimationState();
            setCurrentStep(clampedTarget);
            return;
        }

        if (target === "next" && currentStep < totalSteps) {
            const targetStep = currentStep + 1;
            if (
                !shouldNavigate(targetStep, {
                    type: "step",
                    direction: "forward",
                })
            ) {
                return;
            }

            setAnimatingCard(currentStep);
            setAnimationType("flyOut");
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
            animationTimeoutRef.current = setTimeout(() => {
                setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
                resetAnimationState();
            }, animationDuration);
        } else if (target === "prev" && currentStep > 1) {
            const targetStep = currentStep - 1;
            if (
                !shouldNavigate(targetStep, {
                    type: "step",
                    direction: "backward",
                })
            ) {
                return;
            }

            setAnimatingCard(currentStep - 1);
            setAnimationType("slideIn");
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
            animationTimeoutRef.current = setTimeout(() => {
                setCurrentStep((prev) => Math.max(1, prev - 1));
                resetAnimationState();
            }, animationDuration);
        }
    };
    }, [isAnimating, totalSteps, currentStep, shouldNavigate, animationDuration, resetAnimationState]);

    /**
     * Handle input start (touch/mouse down)
     * @param {Event} e - Touch or mouse event
     */
    const handleInputStart = useCallback((e) => {
        if (isAnimating) return;

        // Check if the drag started on an interactive element
        const target = e.target;
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

        // Don't start card dragging for form elements, badges, emoji components, clickable elements, or progress elements
        if (
            isFormElement ||
            isBadgeElement ||
            isEmojiElement ||
            isClickableElement ||
            isProgressElement
        ) {
            return; // Don't preventDefault here to allow normal form interaction
        }

        e.preventDefault();
        setIsDragging(true);
        setTouchEnd(null);
        setTouchStart(getClientX(e));
        setTouchStartY(getClientY(e));
        setDragOffset(0);
    }, [isAnimating]);

    /**
     * Handle input move (touch/mouse move)
     * @param {Event} e - Touch or mouse event
     */
    const handleInputMove = useCallback((e) => {
        if (!touchStart || isAnimating || !isDragging) return;

        // Don't prevent default on move to allow text selection
        const currentX = getClientX(e);
        const currentY = getClientY(e);
        setTouchEnd(currentX);

        // Allow dragging in both directions, but limit right drag
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
    }, [touchStart, isAnimating, isDragging, touchStartY]);

    /**
     * Handle input end (touch/mouse up)
     */
    const handleInputEnd = useCallback(() => {
        if (!isDragging) return;

        // Don't prevent default to allow normal form interactions
        setIsDragging(false);

        if (!touchStart || !touchEnd || isAnimating) {
            setDragOffset(0);
            setTouchStart(null);
            setTouchStartY(null);
            setTouchEnd(null);
            return;
        }

        const swipeDistance = touchStart - touchEnd;
        const isLeftSwipe = swipeDistance > MIN_SWIPE_DISTANCE;
        const isRightSwipe = swipeDistance < -MIN_SWIPE_DISTANCE;

        if (isLeftSwipe) {
            navigateToStep("next");
        } else if (isRightSwipe) {
            navigateToStep("prev");
        } else {
            setDragOffset(0);
        }

        setTouchStart(null);
        setTouchStartY(null);
        setTouchEnd(null);
    }, [isDragging, touchStart, touchEnd, isAnimating, navigateToStep]);

    /**
     * Handle mouse leave to stop dragging
     */
    const handleMouseLeave = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            setDragOffset(0);
            setTouchStart(null);
            setTouchStartY(null);
            setTouchEnd(null);
        }
    }, [isDragging]);

    return {
        // State
        currentStep,
        animatingCard,
        animationType,
        isAnimating,

        // Configuration
        totalSteps,
        animationDuration,

        // Functions
        navigateToStep,
    };
};
