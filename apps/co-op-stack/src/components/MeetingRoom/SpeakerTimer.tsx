import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpeakerTimerProps {
  startedAt?: Date;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-3xl",
};

const iconSizes = {
  sm: "w-3.5 h-3.5",
  md: "w-5 h-5",
  lg: "w-7 h-7",
};

export const SpeakerTimer = ({ startedAt, className, size = "md" }: SpeakerTimerProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!startedAt) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const display = `${mins}:${secs.toString().padStart(2, "0")}`;

  // Color thresholds: green <2min, yellow 2-3min, red 3min+
  const colorClass =
    elapsed < 120
      ? "text-success"
      : elapsed < 180
        ? "text-warning"
        : "text-destructive";

  return (
    <div className={cn("flex items-center gap-1.5 font-mono font-bold", sizeClasses[size], colorClass, className)}>
      <Timer className={iconSizes[size]} />
      <span>{display}</span>
    </div>
  );
};
