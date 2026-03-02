import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Deterministic color palette using HSL semantic-friendly values
const AVATAR_COLORS = [
  "hsl(2, 55%, 38%)",    // primary-ish maroon
  "hsl(200, 80%, 45%)",  // ocean blue
  "hsl(120, 45%, 40%)",  // forest green
  "hsl(45, 85%, 50%)",   // warm amber
  "hsl(280, 55%, 50%)",  // purple
  "hsl(350, 65%, 50%)",  // rose
  "hsl(170, 55%, 40%)",  // teal
  "hsl(30, 70%, 45%)",   // burnt orange
  "hsl(240, 50%, 55%)",  // indigo
  "hsl(80, 50%, 42%)",   // olive
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getColor(name: string): string {
  return AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length];
}

interface ParticipantAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  isSpeaking?: boolean;
}

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-2xl",
};

export const ParticipantAvatar = ({ name, size = "md", className, isSpeaking = false }: ParticipantAvatarProps) => {
  const bgColor = getColor(name);
  const initials = getInitials(name);

  return (
    <Avatar className={cn(
      sizeClasses[size],
      "transition-fast",
      isSpeaking && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg",
      className
    )}>
      <AvatarFallback
        style={{ backgroundColor: bgColor, color: "white" }}
        className="font-bold"
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};
