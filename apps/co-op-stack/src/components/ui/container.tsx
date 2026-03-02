import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const containerVariants = cva(
  "mx-auto w-full",
  {
    variants: {
      size: {
        default: "container px-4",
        sm: "max-w-screen-sm px-4",
        md: "max-w-screen-md px-4",
        lg: "max-w-screen-lg px-4",
        xl: "max-w-screen-xl px-4",
        full: "max-w-full px-4",
      },
      spacing: {
        none: "py-0",
        sm: "py-4",
        md: "py-8",
        lg: "py-12",
        xl: "py-16",
      },
    },
    defaultVariants: {
      size: "default",
      spacing: "md",
    },
  }
)

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, spacing, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(containerVariants({ size, spacing }), className)}
        {...props}
      />
    )
  }
)
Container.displayName = "Container"

export { Container, containerVariants }
