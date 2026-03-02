import { Hand, MessageCircle, HelpCircle, Info, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileActionBarProps {
  isInQueue: boolean;
  onJoinQueue: (type: string) => void;
  onLeaveQueue: () => void;
  className?: string;
}

const actionItems = [
  { type: "speak", label: "Speak", icon: Hand },
  { type: "direct-response", label: "Direct", icon: MessageCircle },
  { type: "point-of-info", label: "Info", icon: Info },
  { type: "clarification", label: "Clarify", icon: HelpCircle },
];

export const MobileActionBar = ({
  isInQueue,
  onJoinQueue,
  onLeaveQueue,
  className,
}: MobileActionBarProps) => {
  return (
    <div className={cn("fixed inset-x-0 bottom-0 z-40 sm:hidden", className)}>
      <div className="mx-auto w-full max-w-md px-4 pb-4">
        <div className="rounded-2xl border border-border/60 bg-card/95 shadow-lg backdrop-blur">
          {isInQueue ? (
            <div className="px-4 py-4">
              <button
                onClick={onLeaveQueue}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-destructive text-destructive-foreground py-3 font-semibold shadow-md transition-colors hover:bg-destructive/90 active:bg-destructive/80 button-press"
              >
                <LogOut className="h-4 w-4" />
                Leave Queue
              </button>
              <p className="mt-2 text-xs text-muted-foreground text-center">
                You&apos;re in the queue. We&apos;ll notify you when you&apos;re up next.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 px-3 py-3">
              {actionItems.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => onJoinQueue(type)}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl bg-muted/60 text-foreground py-2.5 text-xs font-semibold transition-colors hover:bg-muted button-press"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
