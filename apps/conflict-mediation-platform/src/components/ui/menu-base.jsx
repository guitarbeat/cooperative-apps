import { cn } from "../../lib/utils.js";

// * Shared menu item base component to reduce duplication
export function createMenuItemComponent(PrimitiveItem, slotName) {
  return function MenuItem({
    className,
    inset,
    variant = "default",
    ...props
  }) {
    return (
      <PrimitiveItem
        data-slot={slotName}
        data-inset={inset}
        data-variant={variant}
        className={cn(
          "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          className
        )}
        {...props}
      />
    );
  };
}

// * Shared checkbox item base component
export function createMenuCheckboxItemComponent(
  PrimitiveCheckboxItem,
  slotName,
  ItemIndicator,
  CheckIcon
) {
  return function MenuCheckboxItem({ className, children, checked, ...props }) {
    return (
      <PrimitiveCheckboxItem
        data-slot={slotName}
        className={cn(
          "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          className
        )}
        checked={checked}
        {...props}
      >
        <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
          <ItemIndicator>
            <CheckIcon className="size-4" />
          </ItemIndicator>
        </span>
        {children}
      </PrimitiveCheckboxItem>
    );
  };
}

// * Shared radio item base component
export function createMenuRadioItemComponent(
  PrimitiveRadioItem,
  slotName,
  ItemIndicator,
  CircleIcon
) {
  return function MenuRadioItem({ className, children, ...props }) {
    return (
      <PrimitiveRadioItem
        data-slot={slotName}
        className={cn(
          "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          className
        )}
        {...props}
      >
        <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
          <ItemIndicator>
            <CircleIcon className="size-2 fill-current" />
          </ItemIndicator>
        </span>
        {children}
      </PrimitiveRadioItem>
    );
  };
}

// * Shared label component
export function createMenuLabelComponent(PrimitiveLabel, slotName) {
  return function MenuLabel({ className, inset, ...props }) {
    return (
      <PrimitiveLabel
        data-slot={slotName}
        data-inset={inset}
        className={cn(
          "text-foreground px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
          className
        )}
        {...props}
      />
    );
  };
}

// * Shared separator component
export function createMenuSeparatorComponent(PrimitiveSeparator, slotName) {
  return function MenuSeparator({ className, ...props }) {
    return (
      <PrimitiveSeparator
        data-slot={slotName}
        className={cn("bg-border -mx-1 my-1 h-px", className)}
        {...props}
      />
    );
  };
}

// * Shared shortcut component
export function createMenuShortcutComponent(slotName) {
  return function MenuShortcut({ className, ...props }) {
    return (
      <span
        data-slot={slotName}
        className={cn(
          "text-muted-foreground ml-auto text-xs tracking-widest",
          className
        )}
        {...props}
      />
    );
  };
}

// * Shared sub trigger component
export function createMenuSubTriggerComponent(
  PrimitiveSubTrigger,
  slotName,
  ChevronRightIcon
) {
  return function MenuSubTrigger({ className, inset, children, ...props }) {
    return (
      <PrimitiveSubTrigger
        data-slot={slotName}
        data-inset={inset}
        className={cn(
          "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          className
        )}
        {...props}
      >
        {children}
        <ChevronRightIcon className="ml-auto" />
      </PrimitiveSubTrigger>
    );
  };
}

// * Shared sub content component
export function createMenuSubContentComponent(
  PrimitiveSubContent,
  slotName,
  transformOrigin
) {
  return function MenuSubContent({ className, ...props }) {
    return (
      <PrimitiveSubContent
        data-slot={slotName}
        className={cn(
          `bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(${transformOrigin}) overflow-hidden rounded-md border p-1 shadow-lg`,
          className
        )}
        {...props}
      />
    );
  };
}
