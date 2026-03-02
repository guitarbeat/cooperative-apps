import { useState, type ReactElement, memo } from "react";
import { Users, LogOut, Copy, Check, Link, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MeetingHeaderProps {
  meetingData: {
    code: string;
    title: string;
    facilitator: string;
  };
  participantCount: number;
  onLeaveMeeting: () => void;
  additionalBadge?: ReactElement;
}

export const MeetingHeader = memo(({ meetingData, participantCount, onLeaveMeeting, additionalBadge }: MeetingHeaderProps) => {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const copyMeetingCode = async () => {
    await navigator.clipboard.writeText(meetingData.code);
    setCopiedCode(true);
    toast({
      title: "Copied!",
      description: "Meeting code copied to clipboard",
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyInviteLink = async () => {
    const link = `${window.location.origin}/meeting?mode=join&code=${meetingData.code}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const generateQr = async () => {
    const link = `${window.location.origin}/meeting?mode=join&code=${meetingData.code}`;
    const dataUrl = await QRCode.toDataURL(link, { width: 256, margin: 2 });
    setQrUrl(dataUrl);
    setShowQr(true);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl border-0 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">{meetingData.title}</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
            Facilitated by {meetingData.facilitator} • Code: {meetingData.code}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span>{participantCount} participants</span>
          </div>
          {additionalBadge}
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <button
              onClick={() => void copyMeetingCode()}
              className="flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:active:bg-slate-500 min-h-[44px] transition-colors"
              title="Copy meeting code"
              aria-label="Copy meeting code to clipboard"
            >
              {copiedCode ? <Check className="w-4 h-4 mr-1.5 text-green-600" /> : <Copy className="w-4 h-4 mr-1.5" />}
              {copiedCode ? 'Copied!' : 'Code'}
            </button>
            <button
              onClick={() => void copyInviteLink()}
              className="flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:active:bg-slate-500 min-h-[44px] transition-colors"
              title="Copy invite link"
              aria-label="Copy invite link to clipboard"
            >
              {copiedLink ? <Check className="w-4 h-4 mr-1.5 text-green-600" /> : <Link className="w-4 h-4 mr-1.5" />}
              {copiedLink ? 'Copied!' : 'Invite'}
            </button>
            <button
              onClick={() => void generateQr()}
              className="flex items-center justify-center px-3 py-2 sm:py-2.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:active:bg-slate-500 min-h-[44px] transition-colors"
              title="Show QR code"
              aria-label="Generate QR code for this meeting"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={onLeaveMeeting}
              className="flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 dark:hover:bg-red-900/20 dark:active:bg-red-900/30 transition-colors min-h-[44px]"
              aria-label="Leave meeting and return to home"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Scan to Join</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {qrUrl && <img src={qrUrl} alt="QR Code to join meeting" className="rounded-lg" />}
            <p className="text-sm text-muted-foreground text-center">
              Code: <span className="font-mono font-bold">{meetingData.code}</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

MeetingHeader.displayName = "MeetingHeader";
