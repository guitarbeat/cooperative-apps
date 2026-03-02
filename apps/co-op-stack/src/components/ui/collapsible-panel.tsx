import * as React from "react"
import { cn } from "@/lib/utils"
import { DragHandle } from "./drag-handle"
import { useSnapDetent, Detent } from "@/hooks/useSnapDetent"

interface CollapsiblePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultDetent?: Detent;
  onDetentChange?: (detent: Detent) => void;
  header?: React.ReactNode;
  showDragHandle?: boolean;
  collapsedHeight?: number;
  halfHeight?: string;
}

const CollapsiblePanel = React.forwardRef<HTMLDivElement, CollapsiblePanelProps>(
  ({ 
    className, 
    children, 
    defaultDetent = Detent.Half,
    onDetentChange,
    header,
    showDragHandle = true,
    collapsedHeight = 0,
    halfHeight = '50%',
    ...props 
  }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = React.useState(400);

    React.useEffect(() => {
      if (containerRef.current?.parentElement) {
        const updateHeight = () => {
          setContainerHeight(containerRef.current?.parentElement?.clientHeight || 400);
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
      }
    }, []);

    const { detent, position, isDragging, handlers } = useSnapDetent(containerHeight, {
      initialDetent: defaultDetent,
      onDetentChange,
    });

    const heightValue = isDragging 
      ? `${position * 100}%`
      : detent === Detent.Full 
        ? '100%' 
        : detent === Detent.Half 
          ? halfHeight 
          : `${collapsedHeight}px`;

    return (
      <div
        ref={ref}
        className={cn(
          "panel-collapsible bg-card border border-border rounded-t-lg overflow-hidden",
          isDragging && "select-none",
          className
        )}
        style={{
          height: heightValue,
          transition: isDragging ? 'none' : undefined,
        }}
        data-state={detent}
        {...props}
      >
        {showDragHandle && (
          <DragHandle
            isDragging={isDragging}
            {...handlers}
          />
        )}
        
        {header && (
          <div className="px-4 pb-2 border-b border-border/50">
            {header}
          </div>
        )}
        
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto"
        >
          {children}
        </div>
      </div>
    );
  }
);
CollapsiblePanel.displayName = "CollapsiblePanel";

export { CollapsiblePanel, Detent };
