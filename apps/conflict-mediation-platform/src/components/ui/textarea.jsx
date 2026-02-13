import * as React from "react";

import { cn } from "../../lib/utils";

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground bg-input dark:bg-input flex field-sizing-content min-h-32 w-full rounded-lg border px-4 py-4 text-base shadow-sm transition-[color,box-shadow,border-color] outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-y",
        "focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-2 focus-visible:bg-background",
        "hover:border-ring/60 hover:bg-background/50",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      {...props}
    />
  );
}

export { Textarea };
