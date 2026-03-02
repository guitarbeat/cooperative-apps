import * as React from "react"
import { cn } from "@/lib/utils"

interface DragHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  isDragging?: boolean;
  variant?: 'pill' | 'bar' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
}

const DragHandle = React.forwardRef<HTMLDivElement, DragHandleProps>(
  ({ className, isDragging = false, variant = 'pill', size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: variant === 'pill' ? 'w-8 h-1' : 'w-full h-1',
      md: variant === 'pill' ? 'w-9 h-1.5' : 'w-full h-1.5',
      lg: variant === 'pill' ? 'w-12 h-2' : 'w-full h-2',
    };

    const variantClasses = {
      pill: 'rounded-full mx-auto',
      bar: 'rounded-sm',
      minimal: 'rounded-full mx-auto opacity-50',
    };

    return (
      <div
        ref={ref}
        className={cn(
          "drag-handle flex items-center justify-center py-2",
          isDragging && "dragging",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "bg-muted-foreground/30 transition-all duration-fast ease-interaction",
            "hover:bg-muted-foreground/50 hover:scale-x-110",
            isDragging && "bg-muted-foreground/60 scale-x-125",
            sizeClasses[size],
            variantClasses[variant]
          )}
        />
      </div>
    );
  }
);
DragHandle.displayName = "DragHandle";

export { DragHandle };
