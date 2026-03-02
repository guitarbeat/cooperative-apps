import { cn } from "@/lib/utils";
import { Button } from "./button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  illustration?: "meetings" | "rooms" | "search" | "empty";
  className?: string;
}

// Simple SVG illustrations
const illustrations = {
  meetings: (
    <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
      <rect x="30" y="60" width="140" height="80" rx="8" className="fill-muted/50 stroke-border" strokeWidth="2" />
      <rect x="50" y="40" width="100" height="30" rx="4" className="fill-card stroke-border" strokeWidth="2" />
      <circle cx="70" cy="100" r="15" className="fill-primary/20 stroke-primary/40" strokeWidth="2" />
      <circle cx="100" cy="100" r="15" className="fill-primary/30 stroke-primary/50" strokeWidth="2" />
      <circle cx="130" cy="100" r="15" className="fill-primary/20 stroke-primary/40" strokeWidth="2" />
      <path d="M70 55 L75 50 L80 55" className="stroke-muted-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M120 55 L125 50 L130 55" className="stroke-muted-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="88" y="48" width="24" height="14" rx="2" className="fill-primary/20" />
    </svg>
  ),
  rooms: (
    <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
      <rect x="20" y="30" width="70" height="50" rx="6" className="fill-card stroke-border" strokeWidth="2" />
      <rect x="110" y="30" width="70" height="50" rx="6" className="fill-card stroke-border" strokeWidth="2" />
      <rect x="20" y="95" width="70" height="50" rx="6" className="fill-card stroke-border" strokeWidth="2" />
      <rect x="110" y="95" width="70" height="50" rx="6" className="fill-muted/30 stroke-border stroke-dashed" strokeWidth="2" />
      <circle cx="55" cy="55" r="8" className="fill-primary/30" />
      <circle cx="145" cy="55" r="8" className="fill-primary/30" />
      <circle cx="55" cy="120" r="8" className="fill-primary/30" />
      <path d="M140 115 L145 120 L150 115" className="stroke-primary/40" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M145 120 L145 125" className="stroke-primary/40" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
      <circle cx="90" cy="70" r="35" className="stroke-border" strokeWidth="3" fill="none" />
      <path d="M115 95 L145 125" className="stroke-primary/60" strokeWidth="4" strokeLinecap="round" />
      <circle cx="90" cy="70" r="20" className="fill-muted/30" />
      <path d="M80 65 Q90 55 100 65" className="stroke-muted-foreground" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="82" cy="75" r="3" className="fill-muted-foreground" />
      <circle cx="98" cy="75" r="3" className="fill-muted-foreground" />
    </svg>
  ),
  empty: (
    <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
      <rect x="50" y="40" width="100" height="80" rx="8" className="fill-muted/30 stroke-border stroke-dashed" strokeWidth="2" />
      <path d="M85 70 L100 85 L115 70" className="stroke-muted-foreground" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M100 85 L100 95" className="stroke-muted-foreground" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="105" r="3" className="fill-muted-foreground" />
    </svg>
  ),
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration = "empty",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6 animate-fade-in",
        className
      )}
    >
      <div className="w-48 h-36 mb-6 opacity-80">
        {illustrations[illustration]}
      </div>
      
      {Icon && (
        <div className="mb-4 p-3 rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      
      {action && (
        <Button
          onClick={action.onClick}
          size="lg"
          className="group transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {action.icon && (
            <action.icon className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
          )}
          {action.label}
        </Button>
      )}
    </div>
  );
}