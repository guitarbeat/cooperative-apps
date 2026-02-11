import React, { useEffect, useRef } from "react";
import StepCard from "./StepCard";
import { useCardSwipe } from "../hooks/useCardSwipe";

const CardStack = ({
  totalSteps,
  currentStep,
  animatingCard,
  animationType,
  stepElements,
  onNavigate,
  isDragging,
  onInputStart,
  onInputMove,
  onInputEnd,
  onMouseLeave,
  renderStepContent,
}) => {
  const cardRefs = useRef({});

  const { dragOffset, handlers } = useCardSwipe({
    onSwipeLeft: () => onNavigate && onNavigate("next"),
    onSwipeRight: () => onNavigate && onNavigate("prev"),
    disabled: animatingCard !== null,
  });

  const {
    handleInputStart,
    handleInputMove,
    handleInputEnd,
    handleMouseLeave,
  } = handlers;

  // Add event listeners with proper passive options
  useEffect(() => {
    const currentCard = cardRefs.current[currentStep];
    if (!currentCard) return;

    // Add event listeners with passive: false for touch events
    currentCard.addEventListener("touchstart", handleInputStart, {
      passive: false,
    });
    currentCard.addEventListener("touchmove", handleInputMove, {
      passive: false,
    });
    currentCard.addEventListener("touchend", handleInputEnd, {
      passive: false,
    });
    currentCard.addEventListener("mousedown", handleInputStart);
    currentCard.addEventListener("mousemove", handleInputMove);
    currentCard.addEventListener("mouseup", handleInputEnd);
    currentCard.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      currentCard.removeEventListener("touchstart", handleInputStart);
      currentCard.removeEventListener("touchmove", handleInputMove);
      currentCard.removeEventListener("touchend", handleInputEnd);
      currentCard.removeEventListener("mousedown", handleInputStart);
      currentCard.removeEventListener("mousemove", handleInputMove);
      currentCard.removeEventListener("mouseup", handleInputEnd);
      currentCard.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [
    currentStep,
    handleInputStart,
    handleInputMove,
    handleInputEnd,
    handleMouseLeave,
  ]);
  const renderCardStack = () => {
    return Array.from({ length: totalSteps }, (_, index) => {
      const stepNumber = index + 1;
      const isThisCardAnimating = animatingCard === stepNumber;
      const isActive = stepNumber === currentStep;
      const isNext = stepNumber === currentStep + 1;
      const isPrevious = stepNumber === currentStep - 1;

      // Only render visible cards
      const isInVisibleRange =
        stepNumber >= currentStep - 1 && stepNumber <= currentStep + 1;
      if (!isThisCardAnimating && !isInVisibleRange) return null;

      // Determine card style
      let cardStyle = { transformOrigin: "center bottom" };

      if (isThisCardAnimating && animationType === "flyOut") {
        cardStyle = {
          ...cardStyle,
          transform: "translateX(-100vw) rotate(-15deg)",
          opacity: 0,
          zIndex: 30,
        };
      } else if (isThisCardAnimating && animationType === "slideIn") {
        // Previous card sliding in from left to cover current card
        cardStyle = {
          ...cardStyle,
          transform: "translateX(0) rotate(0deg)",
          opacity: 1,
          zIndex: 35,
        };
      } else if (isActive) {
        cardStyle = {
          ...cardStyle,
          transform: `translateX(${dragOffset}px) rotate(${
            dragOffset * 0.1
          }deg)`,
          opacity: 1,
          zIndex: 30,
        };
      } else if (isNext) {
        // Hide next card completely until dragging starts
        const shouldShowNext = dragOffset < -20; // Show when dragging left more than 20px
        cardStyle = {
          ...cardStyle,
          transform: "translateX(0) rotate(0deg)",
          opacity: shouldShowNext ? 1 : 0,
          zIndex: 20,
        };
      } else if (isPrevious) {
        // Previous card starts hidden to the left, ready to slide in
        if (isThisCardAnimating && animationType === "slideIn") {
          // This case is handled above, but just in case
          cardStyle = {
            ...cardStyle,
            transform: "translateX(0) rotate(0deg)",
            opacity: 1,
            zIndex: 35,
          };
        } else {
          cardStyle = {
            ...cardStyle,
            transform: "translateX(-100vw) rotate(0deg)",
            opacity: 1,
            zIndex: 10,
          };
        }
      } else {
        return null;
      }

      return (
        <div
          key={stepNumber}
          ref={(el) => {
            if (isActive) {
              cardRefs.current[stepNumber] = el;
            }
          }}
          className={`absolute inset-0 draggable-card-container ${
            isActive ? "cursor-pointer" : ""
          } ${
            isThisCardAnimating && animationType === "slideIn"
              ? "slide-in-animation"
              : "transition-all duration-[400ms] ease-out"
          }`}
          style={cardStyle}
          data-testid={isActive ? "current-card" : ""}
        >
          <StepCard>{renderStepContent(stepNumber)}</StepCard>
        </div>
      );
    });
  };

  return (
    <div
      className="relative min-h-[60vh] sm:min-h-[500px] pb-8"
      style={{ height: "auto" }}
    >
      {renderCardStack()}
    </div>
  );
};

export default CardStack;
