import { useState, useCallback, useRef, useEffect, type DragEvent } from 'react';

interface UseDragAndDropProps {
  isFacilitator: boolean;
}

interface UseDragAndDropReturn {
  dragIndex: number | null;
  dragOverIndex: number | null;
  handleDragStart: (index: number) => void;
  handleDragOver: (e: DragEvent<HTMLDivElement>, index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (index: number, onReorder: (dragIndex: number, targetIndex: number) => void) => void;
  handleDragEnd: () => void;
  isDragOver: (index: number) => boolean;
}

export const useDragAndDrop = ({ isFacilitator }: UseDragAndDropProps): UseDragAndDropReturn => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // * Use refs to keep track of current state without updating callback dependencies
  const dragIndexRef = useRef(dragIndex);

  useEffect(() => {
    dragIndexRef.current = dragIndex;
  }, [dragIndex]);

  const handleDragStart = useCallback((index: number) => {
    // Disallow dragging current speaker (index 0)
    if (index === 0) {
      return;
    }
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, index: number) => {
    // Allow dropping only on non-current speaker positions
    if (index === 0) {
      return;
    }
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((index: number, onReorder: (dragIndex: number, targetIndex: number) => void) => {
    const currentDragIndex = dragIndexRef.current;

    if (currentDragIndex === null) {
      return;
    }
    if (currentDragIndex === 0) {
      return;
    } // safety check

    // Do not allow dropping into current speaker slot
    const targetIndex = index === 0 ? 1 : index;

    if (targetIndex === currentDragIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    // If not facilitator, only allow moving backwards (targetIndex > dragIndex)
    if (!isFacilitator && targetIndex <= currentDragIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    onReorder(currentDragIndex, targetIndex);
    setDragIndex(null);
    setDragOverIndex(null);
  }, [isFacilitator]); // * dragIndex dependency removed to keep callback stable

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  const isDragOver = useCallback((index: number) => {
    return dragOverIndex === index;
  }, [dragOverIndex]);

  return {
    dragIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    isDragOver
  };
};
