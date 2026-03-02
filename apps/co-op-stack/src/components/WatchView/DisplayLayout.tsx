import { memo, type FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SpeakingAnalytics } from "./SpeakingAnalytics";
import { NowSpeaking } from "@/components/MeetingRoom/NowSpeaking";
import { ParticipantAvatar } from "@/components/ui/participant-avatar";
import { 
  Users
} from "lucide-react";
import type {
  MeetingData,
  Participant,
  SpeakingQueue,
  CurrentSpeaker,
} from "@/types/meeting";

interface DisplayLayoutProps {
  meetingData: MeetingData;
  participants: Participant[];
  currentSpeaker?: CurrentSpeaker;
  speakingQueue: SpeakingQueue[];
  speakingDistribution?: Array<{
    name: string;
    value: number; // in seconds
  }>;
  totalSpeakingTime?: number;
  averageSpeakingTime?: number;
  meetingDuration?: number;
  totalParticipants?: number;
  queueActivity?: number;
  directResponses?: number;
  showSpeakingAnalytics?: boolean;
}

export const DisplayLayout: FC<DisplayLayoutProps> = memo(({
  meetingData,
  participants,
  currentSpeaker,
  speakingQueue,
  speakingDistribution = [],
  totalSpeakingTime = 0,
  averageSpeakingTime = 0,
  meetingDuration = 0,
  totalParticipants = 0,
  queueActivity = 0,
  directResponses = 0,
  showSpeakingAnalytics = false
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
            {meetingData.title}
          </h1>
          <div className="flex justify-center items-center gap-4 text-lg sm:text-xl text-muted-foreground">
            <span>Code: <strong className="text-foreground">{meetingData.code}</strong></span>
            <span>•</span>
            <span>Facilitated by: <strong className="text-foreground">{meetingData.facilitator}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Speaker - NowSpeaking Spotlight */}
          <div className="lg:col-span-2">
            <NowSpeaking
              speakerName={currentSpeaker?.participantName}
              startedAt={currentSpeaker?.startedSpeakingAt}
            />
          </div>

          {/* Speaking Queue */}
          <div className="space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Speaking Queue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {speakingQueue.length > 0 ? (
                  speakingQueue.slice(0, 5).map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`p-4 rounded-lg border-2 transition-all slide-up-fade card-hover-lift ${
                        index === 0
                          ? 'bg-primary/10 border-primary text-primary dark:bg-primary/20'
                          : 'bg-muted border-border dark:bg-muted/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ParticipantAvatar name={entry.participantName} size="sm" isSpeaking={index === 0} />
                          <span className="font-semibold text-lg">
                            {entry.participantName}
                          </span>
                        </div>
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          {index === 0 ? "Now" : `#${index + 1}`}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No one in queue</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Speaking Analytics - Hidden in watch mode */}
            {showSpeakingAnalytics && speakingDistribution.length > 0 && (
              <SpeakingAnalytics
                speakingDistribution={speakingDistribution}
                totalSpeakingTime={totalSpeakingTime}
                averageSpeakingTime={averageSpeakingTime}
                meetingDuration={meetingDuration}
                totalParticipants={totalParticipants}
                queueActivity={queueActivity}
                directResponses={directResponses}
                currentSpeaker={currentSpeaker?.participantName}
                isHostMode={false}
              />
            )}
          </div>
        </div>

        {/* Participants Count */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-card px-6 py-3 rounded-full shadow-lg">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="text-lg font-semibold text-foreground">
              {participants.length} {participants.length === 1 ? 'Participant' : 'Participants'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

DisplayLayout.displayName = "DisplayLayout";

export default DisplayLayout;
