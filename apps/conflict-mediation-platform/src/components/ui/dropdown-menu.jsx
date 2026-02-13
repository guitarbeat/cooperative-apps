"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";

import { cn } from "../../lib/utils";
import {
  createMenuItemComponent,
  createMenuCheckboxItemComponent,
  createMenuLabelComponent,
  createMenuSeparatorComponent,
  createMenuShortcutComponent,
  createMenuSubTriggerComponent,
  createMenuSubContentComponent,
} from "./menu-base.jsx";

// * Create shared menu components using the base factory functions
const DropdownMenuItem = createMenuItemComponent(
  DropdownMenuPrimitive.Item,
  "dropdown-menu-item"
);

const DropdownMenuCheckboxItem = createMenuCheckboxItemComponent(
  DropdownMenuPrimitive.CheckboxItem,
  "dropdown-menu-checkbox-item",
  DropdownMenuPrimitive.ItemIndicator,
  CheckIcon
);


// Alias base components to avoid duplicate function component names in this file
const DropdownMenuLabelBase = createMenuLabelComponent(
  DropdownMenuPrimitive.Label,
  "dropdown-menu-label"
);

const DropdownMenuSeparatorBase = createMenuSeparatorComponent(
  DropdownMenuPrimitive.Separator,
  "dropdown-menu-separator"
);

const DropdownMenuShortcutBase = createMenuShortcutComponent(
  "dropdown-menu-shortcut"
);

const DropdownMenuSubTriggerBase = createMenuSubTriggerComponent(
  DropdownMenuPrimitive.SubTrigger,
  "dropdown-menu-sub-trigger",
  ChevronRightIcon
);

const DropdownMenuSubContentBase = createMenuSubContentComponent(
  DropdownMenuPrimitive.SubContent,
  "dropdown-menu-sub-content",
  "--radix-dropdown-menu-content-transform-origin"
);

function DropdownMenu({ ...props }) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({ ...props }) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}

function DropdownMenuTrigger({ ...props }) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

function DropdownMenuContent({ className, sideOffset = 4, ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({ ...props }) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}

function DropdownMenuRadioGroup({ ...props }) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}


function DropdownMenuLabel({ className, inset, ...props }) {
  return (
    <DropdownMenuLabelBase
      data-inset={inset}
      className={className}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }) {
  return (
    <DropdownMenuSeparatorBase
      className={className}
      {...props}
    />
  );
}

function DropdownMenuShortcut({ className, ...props }) {
  return (
    <DropdownMenuShortcutBase
      className={className}
      {...props}
    />
  );
}

function DropdownMenuSub({ ...props }) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({ className, inset, children, ...props }) {
  return (
    <DropdownMenuSubTriggerBase
      data-inset={inset}
      className={className}
      {...props}
    >
      {children}
    </DropdownMenuSubTriggerBase>
  );
}

function DropdownMenuSubContent({ className, ...props }) {
  return (
    <DropdownMenuSubContentBase
      className={className}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
