import { useState, useCallback } from 'react';

export interface SpeakingSegment {
  participantId: string;
  participantName: string;
  durationMs: number;
  isDirectResponse: boolean;
}

export const useSpeakingHistory = () => {
  const [speakingHistory, setSpeakingHistory] = useState<SpeakingSegment[]>([]);

  const addSpeakingSegment = useCallback((
    participantId: string,
    participantName: string,
    durationMs: number,
    isDirectResponse: boolean = false
  ) => {
    if (durationMs > 0) {
      setSpeakingHistory(prev => [
        ...prev,
        {
          participantId,
          participantName,
          durationMs,
          isDirectResponse,
        },
      ]);
    }
  }, []);

  const clearSpeakingHistory = useCallback(() => {
    setSpeakingHistory([]);
  }, []);

  const getSpeakingDistribution = useCallback((includeDirectResponses: boolean = true) => {
    // Aggregate data by participant
    const totals = new Map<string, { name: string; ms: number }>();

    // Include finished segments
    for (const seg of speakingHistory) {
      if (!includeDirectResponses && seg.isDirectResponse) {
        continue;
      }
      const key = seg.participantId;
      const prev = totals.get(key) ?? { name: seg.participantName, ms: 0 };
      prev.ms += seg.durationMs;
      totals.set(key, prev);
    }

    return Array.from(totals.values())
      .sort((a, b) => b.ms - a.ms)
      .map((d) => ({ name: d.name, value: Math.round(d.ms / 1000) })); // seconds
  }, [speakingHistory]);

  const getTotalSpeakingTime = useCallback(() => {
    return speakingHistory.reduce((sum, seg) => sum + seg.durationMs, 0);
  }, [speakingHistory]);

  return {
    speakingHistory,
    addSpeakingSegment,
    clearSpeakingHistory,
    getSpeakingDistribution,
    getTotalSpeakingTime
  };
};