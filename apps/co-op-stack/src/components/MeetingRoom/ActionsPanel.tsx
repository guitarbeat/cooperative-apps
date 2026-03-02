import { useState } from "react";
import { Hand, MessageCircle } from "lucide-react";

interface ActionsPanelProps {
  isInQueue: boolean;
  onJoinQueue: (type: string) => void;
  onLeaveQueue: () => void;
  participantName: string;
}

export const ActionsPanel = ({ isInQueue, onJoinQueue, onLeaveQueue, participantName }: ActionsPanelProps) => {
  const [showDirectOptions, setShowDirectOptions] = useState(false);

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-xl border-0">
      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">Actions</h2>
      
      <div className="space-y-4">
        {/* Main speak button */}
        <button
          onClick={isInQueue ? onLeaveQueue : () => onJoinQueue('speak')}
          className={`w-full py-4 sm:py-5 px-4 sm:px-6 rounded-lg font-semibold transition-colors flex items-center justify-center min-h-[48px] text-base sm:text-lg button-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            isInQueue
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80'
          }`}
        >
          <Hand className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
          {isInQueue ? 'Leave Queue' : 'Raise Hand to Speak'}
        </button>

        {/* Direct response options */}
        <div className="space-y-2">
          <button
            onClick={() => setShowDirectOptions(!showDirectOptions)}
            disabled={isInQueue}
            className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-medium transition-colors flex items-center justify-center min-h-[44px] text-sm sm:text-base button-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              isInQueue
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70'
            }`}
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
            Direct Response {showDirectOptions ? '▼' : '▶'}
          </button>

          {showDirectOptions && !isInQueue && (
            <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in">
              <button
                onClick={() => {
                  onJoinQueue('direct-response');
                  setShowDirectOptions(false);
                }}
                className="w-full text-left px-4 py-4 sm:py-3 hover:bg-muted active:bg-muted/80 transition-colors border-b border-border min-h-[48px] button-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="font-medium text-foreground text-sm sm:text-base">Direct Response</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Respond directly to current speaker</div>
              </button>
              <button
                onClick={() => {
                  onJoinQueue('point-of-info');
                  setShowDirectOptions(false);
                }}
                className="w-full text-left px-4 py-4 sm:py-3 hover:bg-muted active:bg-muted/80 transition-colors border-b border-border min-h-[48px] button-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="font-medium text-foreground text-sm sm:text-base">Point of Information</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Share relevant information</div>
              </button>
              <button
                onClick={() => {
                  onJoinQueue('clarification');
                  setShowDirectOptions(false);
                }}
                className="w-full text-left px-4 py-4 sm:py-3 hover:bg-muted active:bg-muted/80 transition-colors min-h-[48px] button-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="font-medium text-foreground text-sm sm:text-base">Clarification</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Ask for clarification</div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Participant info */}
      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border">
        <p className="text-sm sm:text-base text-muted-foreground">
          <strong>You:</strong> {participantName}
        </p>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          <strong>Status:</strong> {isInQueue ? 'In speaking queue' : 'Ready to participate'}
        </p>
      </div>
    </div>
  );
};
