import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"

export interface ExpandableCardProps
  extends React.ComponentPropsWithoutRef<typeof Card> {
  /**
   * Whether the card is expanded by default. Use for uncontrolled state.
   */
  defaultOpen?: boolean
  /**
   * Controlled open state of the card.
   */
  open?: boolean
  /**
   * Event handler called when the open state changes.
   */
  onOpenChange?: (open: boolean) => void
  /**
   * Additional classes applied to the animated content area.
   * Useful for customizing transition duration or keyframes.
   */
  contentClassName?: string
  /**
   * React node rendered in the trigger area, typically a title.
   */
  trigger: React.ReactNode
  children: React.ReactNode
}

const ExpandableCard = React.forwardRef<HTMLDivElement, ExpandableCardProps>(
  (
    {
      className,
      trigger,
      children,
      contentClassName,
      defaultOpen,
      open,
      onOpenChange,
      ...props
    },
    ref,
  ) => (
    <Collapsible
      defaultOpen={defaultOpen ?? false}
      open={open ?? false}
      onOpenChange={onOpenChange ?? (() => {})}
      asChild
    >
      <Card ref={ref} className={className} {...props}>
        <CollapsibleTrigger asChild>
          <CardHeader className="flex cursor-pointer items-center justify-between p-6 [&[data-state=open]>svg]:rotate-180">
            {trigger}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent
          className={cn(
            "overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
            contentClassName,
          )}
        >
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  ),
)
ExpandableCard.displayName = "ExpandableCard"

export { ExpandableCard }

