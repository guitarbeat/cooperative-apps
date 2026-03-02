import { useState, useCallback, useEffect, useRef } from "react";

// ============================================
// PHYSICS CONSTANTS (internal)
// ============================================
const PHYSICS_CONSTANTS = {
  snapThreshold: 0.15,
};

// ============================================
// DETENT STATES
// ============================================
export enum Detent {
  Collapsed = "collapsed",
  Half = "half",
  Full = "full",
}

// ============================================
// useSnapDetent - Snap to discrete states
// ============================================
interface UseSnapDetentOptions {
  initialDetent?: Detent;
  snapThreshold?: number;
  onDetentChange?: (detent: Detent) => void;
}

interface UseSnapDetentReturn {
  detent: Detent;
  setDetent: (detent: Detent) => void;
  position: number; // 0 = collapsed, 0.5 = half, 1 = full
  isDragging: boolean;
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
  };
}

export function useSnapDetent(
  containerHeight: number,
  options: UseSnapDetentOptions = {}
): UseSnapDetentReturn {
  const {
    initialDetent = Detent.Half,
    snapThreshold = PHYSICS_CONSTANTS.snapThreshold,
    onDetentChange,
  } = options;

  const [detent, setDetentState] = useState<Detent>(initialDetent);
  const [position, setPosition] = useState(
    initialDetent === Detent.Full ? 1 : initialDetent === Detent.Half ? 0.5 : 0
  );
  const [isDragging, setIsDragging] = useState(false);

  const startY = useRef(0);
  const startPosition = useRef(0);

  const setDetent = useCallback(
    (newDetent: Detent) => {
      setDetentState(newDetent);
      setPosition(newDetent === Detent.Full ? 1 : newDetent === Detent.Half ? 0.5 : 0);
      onDetentChange?.(newDetent);
    },
    [onDetentChange]
  );

  const handleMove = useCallback(
    (clientY: number) => {
      const delta = startY.current - clientY;
      const deltaPercent = delta / containerHeight;
      const newPosition = Math.max(0, Math.min(1, startPosition.current + deltaPercent));
      setPosition(newPosition);
    },
    [containerHeight]
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);

    // Snap to nearest detent
    let newDetent: Detent;
    if (position < snapThreshold) {
      newDetent = Detent.Collapsed;
    } else if (position > 1 - snapThreshold) {
      newDetent = Detent.Full;
    } else if (Math.abs(position - 0.5) < snapThreshold) {
      newDetent = Detent.Half;
    } else if (position < 0.5) {
      newDetent = position < 0.25 ? Detent.Collapsed : Detent.Half;
    } else {
      newDetent = position > 0.75 ? Detent.Full : Detent.Half;
    }

    setDetent(newDetent);
  }, [position, snapThreshold, setDetent]);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches[0]) handleMove(e.touches[0].clientY);
    };
    const onEnd = () => handleEnd();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const startDrag = useCallback(
    (clientY: number) => {
      startY.current = clientY;
      startPosition.current = position;
      setIsDragging(true);
    },
    [position]
  );

  return {
    detent,
    setDetent,
    position,
    isDragging,
    handlers: {
      onMouseDown: (e: React.MouseEvent) => {
        e.preventDefault();
        startDrag(e.clientY);
      },
      onTouchStart: (e: React.TouchEvent) => {
        if (e.touches[0]) startDrag(e.touches[0].clientY);
      },
    },
  };
}
