import { useEffect } from "react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHost: boolean;
}

export function KeyboardShortcutsModal({ isOpen, onClose, isHost }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card rounded-2xl p-6 max-w-md w-full mx-4 shadow-elegant border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          {isHost && (
            <>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-foreground">Next Speaker</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">Enter</kbd>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-foreground">Undo Last Action</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">Ctrl+Z</kbd>
              </div>
            </>
          )}
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-foreground">Show/Hide Shortcuts</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">?</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
