import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Custom hook for managing step navigation and card animations
 * @param {Object} options
 * @param {Function} [options.canNavigateToStep] - Guard callback; return false to prevent navigation.
 * @param {number} [options.totalSteps=7] - Total number of steps.
 * @param {number} [options.animationDuration=400] - Animation duration in ms.
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
    }, []);

    /**
     * Navigate to the next or previous step
     * @param {string|number} target - 'next', 'prev', or a direct step number
     */
    const navigateToStep = useCallback((target) => {
        if (isAnimating) return;

        if (typeof target === "number") {
            const clampedTarget = Math.max(1, Math.min(totalSteps, target));
            if (clampedTarget === currentStep) return;

            const direction =
                clampedTarget > currentStep ? "forward"
                : clampedTarget < currentStep ? "backward"
                : "none";

            if (!shouldNavigate(clampedTarget, { type: "direct", direction })) return;

            resetAnimationState();
            setCurrentStep(clampedTarget);
            return;
        }

        if (target === "next" && currentStep < totalSteps) {
            const targetStep = currentStep + 1;
            if (!shouldNavigate(targetStep, { type: "step", direction: "forward" })) return;

            setAnimatingCard(currentStep);
            setAnimationType("flyOut");
            if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
            animationTimeoutRef.current = setTimeout(() => {
                setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
                resetAnimationState();
            }, animationDuration);
        } else if (target === "prev" && currentStep > 1) {
            const targetStep = currentStep - 1;
            if (!shouldNavigate(targetStep, { type: "step", direction: "backward" })) return;

            setAnimatingCard(currentStep - 1);
            setAnimationType("slideIn");
            if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
            animationTimeoutRef.current = setTimeout(() => {
                setCurrentStep((prev) => Math.max(1, prev - 1));
                resetAnimationState();
            }, animationDuration);
        }
    }, [isAnimating, totalSteps, currentStep, shouldNavigate, animationDuration, resetAnimationState]);

    return {
        currentStep,
        animatingCard,
        animationType,
        isAnimating,
        totalSteps,
        animationDuration,
        navigateToStep,
    };
};
