import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  size?: "sm" | "md" | "lg"
  variant?: "default" | "outline"
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, checked = false, onCheckedChange, size = "md", variant = "default", ...props }, ref) => {
    const handleClick = () => {
      onCheckedChange?.(!checked)
    }

    const sizeClasses = {
      sm: "h-5 w-9",
      md: "h-6 w-11", 
      lg: "h-7 w-12"
    }

    const thumbSizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6"
    }

    const translateClasses = {
      sm: checked ? "translate-x-4" : "translate-x-0",
      md: checked ? "translate-x-5" : "translate-x-0",
      lg: checked ? "translate-x-5" : "translate-x-0"
    }

    const variantClasses = {
      default: checked 
        ? "bg-primary border-primary" 
        : "bg-muted border-muted-foreground/20",
      outline: checked
        ? "bg-primary border-primary"
        : "bg-background border-border"
    }

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        ref={ref}
        onClick={handleClick}
        className={cn(
          "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 interaction-toggle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block rounded-full bg-background shadow-lg ring-0 interaction-toggle-thumb",
            thumbSizeClasses[size],
            translateClasses[size]
          )}
        />
      </button>
    )
  }
)
Toggle.displayName = "Toggle"

export { Toggle }