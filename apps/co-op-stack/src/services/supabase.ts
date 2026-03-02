import { AppError, ErrorCode } from "../utils/errorHandling";
import { logProduction } from "../utils/productionLogger";
import { generateSecureRandomString } from "@/utils/security";
import { z } from "zod";
import { nameSchema, titleSchema, validateMeetingCode } from "@/utils/schemas";
// Use the single, validated client from integrations to avoid duplicate config
import {
  executeSupabase,
  isSupabaseConnectionError,
  SupabaseOfflineError,
  SupabaseTimeoutError,
  supabase,
  type SupabaseRequestOptions,
} from "@/integrations/supabase/client";

const toErrorInstance = (
  error: unknown,
  fallbackMessage: string,
): Error | undefined => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = String(
      (error as { message?: unknown }).message ?? fallbackMessage,
    );
    return new Error(message);
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return new Error(error);
  }

  return fallbackMessage ? new Error(fallbackMessage) : undefined;
};

const mapSupabaseError = (
  error: unknown,
  fallbackMessage: string,
  fallbackCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (
    isSupabaseConnectionError(error) ||
    error instanceof SupabaseTimeoutError ||
    error instanceof SupabaseOfflineError
  ) {
    return new AppError(
      ErrorCode.SERVER_UNREACHABLE,
      toErrorInstance(error, fallbackMessage),
      "Unable to connect to the Supabase backend. Please verify your Supabase credentials and network connection.",
    );
  }

  return new AppError(
    fallbackCode,
    toErrorInstance(error, fallbackMessage),
    fallbackMessage,
  );
};

const withSupabase = async <T>(
  operation: (client: typeof supabase) => PromiseLike<T>,
  options?: SupabaseRequestOptions,
): Promise<T> => executeSupabase(operation, options);

// Re-export types from centralized location
export type {
  Participant,
  ParticipantSnapshot,
  MeetingData,
  QueueItem,
  MeetingWithParticipants,
  CurrentSpeaker,
  SpeakingQueue,
  MeetingMode,
} from "@/types/meeting";

import type {
  Participant,
  ParticipantSnapshot,
  MeetingData,
  QueueItem,
  MeetingWithParticipants,
} from "@/types/meeting";

type SpeakingQueueRow = {
  id: string;
  participant_id: string;
  queue_type: string;
  position: number;
  joined_queue_at: string;
  is_speaking: boolean;
  participants?: { name: string };
};

// Meeting operations
export class SupabaseMeetingService {
  private static validate<T>(
    schema: z.ZodSchema<T>,
    value: unknown,
    errorCode: ErrorCode,
  ): T {
    const result = schema.safeParse(value);
    if (!result.success) {
      throw new AppError(errorCode, undefined, result.error.errors[0]?.message);
    }
    return result.data;
  }

  // Create a new meeting
  static async createMeeting(
    title: string,
    facilitatorName: string,
    facilitatorId?: string,
  ): Promise<MeetingData> {
    try {
      this.validate(titleSchema, title, ErrorCode.INVALID_MEETING_TITLE);
      this.validate(
        nameSchema,
        facilitatorName,
        ErrorCode.INVALID_PARTICIPANT_NAME,
      );

      const maxCreateAttempts = 5;
      let lastError: AppError | null = null;

      for (let attempt = 0; attempt < maxCreateAttempts; attempt++) {
        const meetingCode = await this.generateMeetingCodeWithFallback();

        const { data, error } = await withSupabase((client) =>
          client
            .from("meetings")
            .insert({
              title: title.trim(),
              facilitator_name: facilitatorName.trim(),
              facilitator_id: facilitatorId ?? null,
              meeting_code: meetingCode,
              is_active: true,
            })
            .select()
            .single(),
        );

        if (!error && data) {
          return {
            id: data.id,
            code: data.meeting_code,
            title: data.title,
            facilitator: data.facilitator_name,
            facilitatorId: data.facilitator_id,
            createdAt: data.created_at,
            isActive: data.is_active ?? true,
          };
        }

        if (
          error?.code === "23505" ||
          error?.message?.includes("duplicate key value")
        ) {
          // Rare collision on meeting code. Retry with a new code and log for observability.
          logProduction("warn", {
            action: "meeting_code_collision",
            attempt: attempt + 1,
            error: error.message,
          });
          lastError = mapSupabaseError(
            error,
            "Generated meeting code was already in use. Retrying...",
          );
          continue;
        }

        throw mapSupabaseError(error ?? undefined, "Failed to create meeting");
      }

      throw (
        lastError ??
        mapSupabaseError(
          undefined,
          "Unable to create meeting after multiple attempts",
        )
      );
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to create meeting");
    }
  }

  private static async generateMeetingCodeWithFallback(): Promise<string> {
    try {
      const { data: codeData, error: codeError } = await withSupabase(
        (client) => client.rpc("generate_meeting_code"),
      );

      if (codeError) {
        throw new Error(`Database function failed: ${codeError.message}`);
      }

      if (typeof codeData === "string" && codeData.trim().length === 6) {
        return codeData.trim().toUpperCase();
      }

      throw new Error("Invalid meeting code generated from database");
    } catch (dbError) {
      // Fallback to client-side generation if database function fails
      logProduction("warn", {
        action: "database_meeting_code_generation_failed",
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });

      const maxAttempts = 10;

      for (let attempts = 0; attempts < maxAttempts; attempts++) {
        const result = generateSecureRandomString(6);

        const { data: existing } = await withSupabase((client) =>
          client
            .from("meetings")
            .select("meeting_code")
            .eq("meeting_code", result)
            .maybeSingle(),
        );

        if (!existing) {
          return result;
        }
      }

      throw mapSupabaseError(
        undefined,
        "Unable to generate unique meeting code after multiple attempts",
      );
    }
  }

  // Get meeting by code
  static async getMeeting(
    code: string,
  ): Promise<MeetingWithParticipants | null> {
    try {
      // Validate meeting code format before making API call
      if (!code || typeof code !== "string") {
        throw new AppError(
          ErrorCode.INVALID_MEETING_CODE,
          undefined,
          "Meeting code is required",
        );
      }

      const normalizedCode = code.toUpperCase().trim();

      // Check if code is exactly 6 characters and contains only valid characters
      if (normalizedCode.length !== 6) {
        throw new AppError(
          ErrorCode.INVALID_MEETING_CODE,
          undefined,
          "Meeting code must be exactly 6 characters",
        );
      }

      if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
        throw new AppError(
          ErrorCode.INVALID_MEETING_CODE,
          undefined,
          "Meeting code can only contain letters and numbers",
        );
      }

      const { data: meeting, error: meetingError } = await withSupabase(
        (client) =>
          client
            .from("meetings")
            .select("*")
            .eq("meeting_code", normalizedCode)
            .eq("is_active", true)
            .single(),
      );

      if (meetingError || !meeting) {
        return null;
      }

      // Get participants
      const { data: participants, error: participantsError } =
        await withSupabase(
          (client) =>
            client
              .from("participants")
              .select("*")
              .eq("meeting_id", meeting.id)
              .eq("is_active", true)
              .order("joined_at", { ascending: true }),
          { dedupeKey: `participants-${meeting.id}` },
        );

      if (participantsError) {
        throw mapSupabaseError(
          participantsError,
          "Failed to fetch participants",
        );
      }

      // Get speaking queue
      const { data: queue, error: queueError } = await withSupabase((client) =>
        client
          .from("speaking_queue")
          .select(
            `
          *,
          participants!inner(name)
        `,
          )
          .eq("meeting_id", meeting.id)
          .order("position", { ascending: true }),
      );

      if (queueError) {
        throw mapSupabaseError(queueError, "Failed to fetch speaking queue");
      }

      const participantRows = (participants ?? []) as Array<{
        id: string;
        name: string;
        is_facilitator: boolean;
        joined_at: string;
        is_active: boolean;
      }>;

      const queueRows = (queue ?? []) as Array<
        SpeakingQueueRow & {
          participants: { name: string };
        }
      >;

      return {
        id: meeting.id,
        code: meeting.meeting_code,
        title: meeting.title,
        facilitator: meeting.facilitator_name,
        facilitatorId: meeting.facilitator_id ?? null,
        createdAt: meeting.created_at,
        isActive: meeting.is_active ?? true,
        participants: participantRows.map((p) => ({
          id: p.id,
          name: p.name,
          isFacilitator: p.is_facilitator,
          hasRaisedHand: false, // Not implemented yet
          joinedAt: p.joined_at,
          isActive: p.is_active,
        })),
        speakingQueue: queueRows.map((q) => ({
          id: q.id,
          participantId: q.participant_id,
          participantName: q.participants.name,
          type: q.queue_type,
          position: q.position,
          timestamp: new Date(q.joined_queue_at).getTime(),
          isSpeaking: q.is_speaking,
          isFacilitator: false, // Queue items don't track facilitator status directly
        })),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to fetch meeting");
    }
  }

  // Check if a user can rejoin as facilitator (name matches original facilitator)
  static async canRejoinAsFacilitator(
    meetingCode: string,
    participantName: string,
  ): Promise<boolean> {
    try {
      const normalizedCode = meetingCode.toUpperCase().trim();
      const normalizedName = participantName.trim().toLowerCase();

      const { data: meeting, error } = await withSupabase((client) =>
        client
          .from("meetings")
          .select("facilitator_name")
          .eq("meeting_code", normalizedCode)
          .eq("is_active", true)
          .single(),
      );

      if (error || !meeting) {
        return false;
      }

      return meeting.facilitator_name.toLowerCase() === normalizedName;
    } catch {
      return false;
    }
  }

  // Join meeting as participant
  static async joinMeeting(
    meetingCode: string,
    participantName: string,
    isFacilitator: boolean = false,
  ): Promise<Participant> {
    try {
      const {
        normalizedCode,
        isValid,
        error: codeError,
      } = validateMeetingCode(meetingCode);
      if (!isValid || !normalizedCode) {
        throw new AppError(
          ErrorCode.INVALID_MEETING_CODE,
          undefined,
          codeError ?? "Invalid meeting code",
        );
      }

      this.validate(
        nameSchema,
        participantName,
        ErrorCode.INVALID_PARTICIPANT_NAME,
      );

      // First, get the meeting
      const meeting = await this.getMeeting(normalizedCode);
      if (!meeting) {
        throw new AppError(
          ErrorCode.MEETING_NOT_FOUND,
          undefined,
          "Meeting not found",
        );
      }

      // Auto-detect facilitator status: if name matches original facilitator, allow rejoining as facilitator
      const nameMatchesFacilitator =
        meeting.facilitator.toLowerCase() ===
        participantName.trim().toLowerCase();
      const shouldBeFacilitator = isFacilitator || nameMatchesFacilitator;

      // Create participant
      const { data, error } = await withSupabase((client) =>
        client
          .from("participants")
          .insert({
            meeting_id: meeting.id,
            name: participantName.trim(),
            is_facilitator: shouldBeFacilitator,
            is_active: true,
          })
          .select()
          .single(),
      );

      if (error) {
        throw mapSupabaseError(error, "Failed to join meeting");
      }

      return {
        id: data.id,
        name: data.name,
        isFacilitator: data.is_facilitator ?? false,
        hasRaisedHand: false,
        joinedAt: data.joined_at,
        isActive: data.is_active ?? true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to join meeting");
    }
  }

  // Join speaking queue
  static async joinQueue(
    meetingId: string,
    participantId: string,
    queueType: string = "speak",
  ): Promise<QueueItem> {
    try {
      // Get current queue to determine position
      const { data: currentQueue, error: queueError } = await withSupabase(
        (client) =>
          client
            .from("speaking_queue")
            .select("position")
            .eq("meeting_id", meetingId)
            .order("position", { ascending: false })
            .limit(1),
        { dedupeKey: `queue-position-${meetingId}` },
      );

      if (queueError) {
        throw mapSupabaseError(queueError, "Failed to fetch queue");
      }

      const queuePositions = (currentQueue ?? []) as Array<
        Pick<SpeakingQueueRow, "position">
      >;
      const nextPosition =
        queuePositions.length > 0 ? queuePositions[0].position + 1 : 1;

      // Get participant name
      const { data: participant, error: participantError } = await withSupabase(
        (client) =>
          client
            .from("participants")
            .select("name")
            .eq("id", participantId)
            .single(),
        { dedupeKey: `participant-${participantId}` },
      );

      if (participantError || !participant) {
        throw mapSupabaseError(participantError, "Participant not found");
      }

      // Add to queue
      const { data, error } = await withSupabase((client) =>
        client
          .from("speaking_queue")
          .insert({
            meeting_id: meetingId,
            participant_id: participantId,
            queue_type: queueType,
            position: nextPosition,
            is_speaking: false,
          })
          .select()
          .single(),
      );

      if (error) {
        throw mapSupabaseError(error, "Failed to join queue");
      }

      return {
        id: data.id,
        participantId: data.participant_id,
        participantName: participant.name,
        type: data.queue_type,
        position: data.position,
        timestamp: new Date(data.joined_queue_at).getTime(),
        isSpeaking: data.is_speaking ?? false,
        isFacilitator: false,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to join queue");
    }
  }

  // Leave speaking queue
  static async leaveQueue(
    meetingId: string,
    participantId: string,
  ): Promise<void> {
    try {
      const { error } = await withSupabase((client) =>
        client
          .from("speaking_queue")
          .delete()
          .eq("meeting_id", meetingId)
          .eq("participant_id", participantId),
      );

      if (error) {
        throw mapSupabaseError(error, "Failed to leave queue");
      }

      // Reorder remaining queue positions
      await this.reorderQueue(meetingId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to leave queue");
    }
  }

  // Move to next speaker (facilitator only)
  static async nextSpeaker(meetingId: string): Promise<QueueItem | null> {
    try {
      // Get current queue
      const { data: queue, error: queueError } = await withSupabase((client) =>
        client
          .from("speaking_queue")
          .select(
            `
          *,
          participants!inner(name)
        `,
          )
          .eq("meeting_id", meetingId)
          .order("position", { ascending: true }),
      );

      if (queueError) {
        throw mapSupabaseError(queueError, "Failed to fetch queue");
      }

      const queueItems = (queue ?? []) as Array<
        SpeakingQueueRow & {
          participants: { name: string };
        }
      >;

      if (queueItems.length === 0) {
        return null;
      }

      // Remove first speaker
      const [nextSpeaker] = queueItems;
      const { error: deleteError } = await withSupabase((client) =>
        client.from("speaking_queue").delete().eq("id", nextSpeaker.id),
      );

      if (deleteError) {
        throw mapSupabaseError(deleteError, "Failed to remove speaker");
      }

      // Reorder remaining queue
      await this.reorderQueue(meetingId);

      return {
        id: nextSpeaker.id,
        participantId: nextSpeaker.participant_id,
        participantName: nextSpeaker.participants.name,
        type: nextSpeaker.queue_type,
        position: nextSpeaker.position,
        timestamp: new Date(nextSpeaker.joined_queue_at).getTime(),
        isSpeaking: nextSpeaker.is_speaking,
        isFacilitator: false,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to move to next speaker");
    }
  }

  // Update meeting title (facilitator only)
  static async updateMeetingTitle(
    meetingId: string,
    newTitle: string,
  ): Promise<void> {
    try {
      this.validate(titleSchema, newTitle, ErrorCode.INVALID_MEETING_TITLE);

      const { error } = await withSupabase((client) =>
        client
          .from("meetings")
          .update({ title: newTitle.trim() })
          .eq("id", meetingId),
      );

      if (error) {
        throw mapSupabaseError(error, "Failed to update meeting title");
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to update meeting title");
    }
  }

  static async updateMeetingCode(
    meetingId: string,
    newCode: string,
  ): Promise<void> {
    try {
      const {
        normalizedCode,
        isValid,
        error: codeError,
      } = validateMeetingCode(newCode);

      if (!isValid || !normalizedCode) {
        throw new AppError(
          ErrorCode.INVALID_MEETING_CODE,
          undefined,
          codeError ?? "Invalid meeting code",
        );
      }

      // Check if the code is already in use by another meeting
      const { data: existing } = await withSupabase((client) =>
        client
          .from("meetings")
          .select("id")
          .eq("meeting_code", normalizedCode)
          .neq("id", meetingId)
          .single(),
      );

      if (existing) {
        throw new AppError(
          ErrorCode.MEETING_CODE_EXISTS,
          undefined,
          "This meeting code is already in use. Please choose a different code.",
        );
      }

      const { error } = await withSupabase((client) =>
        client
          .from("meetings")
          .update({ meeting_code: normalizedCode })
          .eq("id", meetingId),
      );

      if (error) {
        throw mapSupabaseError(error, "Failed to update meeting code");
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to update meeting code");
    }
  }

  // Update participant name (facilitator only)
  static async updateParticipantName(
    participantId: string,
    newName: string,
  ): Promise<void> {
    try {
      this.validate(nameSchema, newName, ErrorCode.INVALID_PARTICIPANT_NAME);

      const { error } = await withSupabase((client) =>
        client
          .from("participants")
          .update({ name: newName.trim() })
          .eq("id", participantId),
      );

      if (error) {
        throw mapSupabaseError(error, "Failed to update participant name");
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to update participant name");
    }
  }

  // Reorder queue item to new position
  static async reorderQueueItem(
    meetingId: string,
    participantId: string,
    newPosition: number,
  ): Promise<void> {
    try {
      // Get current queue to determine how to shift positions
      const { data: currentQueue, error: queueError } = await withSupabase(
        (client) =>
          client
            .from("speaking_queue")
            .select("id, position, participant_id")
            .eq("meeting_id", meetingId)
            .order("position", { ascending: true }),
        { dedupeKey: `queue-${meetingId}` },
      );

      if (queueError) {
        throw mapSupabaseError(
          queueError,
          "Failed to fetch queue for reordering",
        );
      }

      const queueItems = (currentQueue ?? []) as Array<
        Pick<SpeakingQueueRow, "id" | "position" | "participant_id">
      >;

      if (queueItems.length === 0) {
        return;
      }

      const currentItemIndex = queueItems.findIndex(
        (item) => item.position === newPosition,
      );
      if (currentItemIndex === -1) {
        throw mapSupabaseError(undefined, "Invalid position for reordering");
      }

      // Shift positions to make room for the new position
      const updates: Array<{ id: string; position: number }> = [];
      if (newPosition < queueItems[currentItemIndex].position) {
        // Moving up - shift items down
        for (let i = newPosition - 1; i < queueItems.length; i++) {
          if (queueItems[i].position >= newPosition) {
            updates.push({
              id: queueItems[i].id,
              position: queueItems[i].position + 1,
            });
          }
        }
      } else {
        // Moving down - shift items up
        for (let i = 0; i < queueItems.length; i++) {
          if (
            queueItems[i].position > newPosition &&
            queueItems[i].position <= queueItems[currentItemIndex].position
          ) {
            updates.push({
              id: queueItems[i].id,
              position: queueItems[i].position - 1,
            });
          }
        }
      }

      // Update the target item to new position
      const targetItem = queueItems.find(
        (item) => item.participant_id === participantId,
      );
      if (!targetItem) {
        throw mapSupabaseError(undefined, "Participant not found in queue");
      }

      updates.push({
        id: targetItem.id,
        position: newPosition,
      });

      // Execute all updates
      for (const update of updates) {
        const { error } = await withSupabase((client) =>
          client
            .from("speaking_queue")
            .update({ position: update.position })
            .eq("id", update.id),
        );

        if (error) {
          throw mapSupabaseError(error, "Failed to update queue position");
        }
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to reorder queue item");
    }
  }

  // Helper: Reorder queue positions
  private static async reorderQueue(meetingId: string): Promise<void> {
    try {
      const { data: queue, error: queueError } = await withSupabase((client) =>
        client
          .from("speaking_queue")
          .select("id, position")
          .eq("meeting_id", meetingId)
          .order("position", { ascending: true }),
      );

      if (queueError) {
        throw mapSupabaseError(
          queueError,
          "Failed to fetch queue for reordering",
        );
      }

      // Update positions sequentially
      for (let i = 0; i < queue.length; i++) {
        const { error } = await withSupabase((client) =>
          client
            .from("speaking_queue")
            .update({ position: i + 1 })
            .eq("id", queue[i].id),
        );

        if (error) {
          throw mapSupabaseError(error, "Failed to reorder queue");
        }
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to reorder queue");
    }
  }

  // Remove participant from meeting (facilitator only)
  static async removeParticipant(
    participantId: string,
  ): Promise<ParticipantSnapshot> {
    try {
      const { data: participantRow, error: participantError } =
        await withSupabase(
          (client) =>
            client
              .from("participants")
              .select("id, meeting_id, name, is_facilitator, joined_at")
              .eq("id", participantId)
              .maybeSingle(),
          { dedupeKey: `participant-snapshot-${participantId}` },
        );

      if (participantError) {
        throw mapSupabaseError(
          participantError,
          "Failed to fetch participant before removal",
        );
      }

      if (!participantRow) {
        throw new AppError(
          ErrorCode.PARTICIPANT_NOT_FOUND,
          undefined,
          "Participant not found",
        );
      }

      const participantSnapshot: ParticipantSnapshot = {
        id: participantRow.id,
        meetingId: participantRow.meeting_id,
        name: participantRow.name,
        isFacilitator: participantRow.is_facilitator ?? false,
        joinedAt: participantRow.joined_at,
      };

      // First, remove from speaking queue if they're in it
      const { error: queueError } = await withSupabase((client) =>
        client
          .from("speaking_queue")
          .delete()
          .eq("participant_id", participantId),
      );

      if (queueError) {
        throw mapSupabaseError(
          queueError,
          "Failed to remove participant from queue",
        );
      }

      // Then mark the participant as inactive to allow undo
      const { error } = await withSupabase((client) =>
        client
          .from("participants")
          .update({ is_active: false })
          .eq("id", participantId),
      );

      if (error) {
        throw mapSupabaseError(error, "Failed to remove participant");
      }
      return participantSnapshot;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to remove participant");
    }
  }

  static async restoreParticipant(participantId: string): Promise<void> {
    try {
      const { error } = await withSupabase((client) =>
        client
          .from("participants")
          .update({ is_active: true })
          .eq("id", participantId),
      );

      if (error) {
        throw mapSupabaseError(error, "Failed to restore participant");
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to restore participant");
    }
  }

  // End meeting (mark as inactive and clean up)
  static async leaveMeeting(participantId: string): Promise<void> {
    try {
      const { error } = await withSupabase((client) =>
        client
          .from("participants")
          .update({ is_active: false })
          .eq("id", participantId),
      );

      if (error) {
        throw mapSupabaseError(error, "Failed to leave meeting");
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to leave meeting");
    }
  }

  static async endMeeting(meetingId: string): Promise<void> {
    try {
      // Mark meeting as inactive
      const { error: meetingError } = await withSupabase((client) =>
        client
          .from("meetings")
          .update({ is_active: false })
          .eq("id", meetingId),
      );

      if (meetingError) {
        throw mapSupabaseError(meetingError, "Failed to end meeting");
      }

      // Mark all participants as inactive
      const { error: participantsError } = await withSupabase((client) =>
        client
          .from("participants")
          .update({ is_active: false })
          .eq("meeting_id", meetingId),
      );

      if (participantsError) {
        logProduction("warn", {
          action: "failed_to_deactivate_participants",
          meetingId,
          error: participantsError.message,
        });
        // Don't throw here as the meeting is already ended
      }

      // Clear speaking queue
      const { error: queueError } = await withSupabase((client) =>
        client.from("speaking_queue").delete().eq("meeting_id", meetingId),
      );

      if (queueError) {
        logProduction("warn", {
          action: "failed_to_clear_speaking_queue",
          meetingId,
          error: queueError.message,
        });
        // Don't throw here as the meeting is already ended
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to end meeting");
    }
  }

  /**
   * * Get all active meetings for room browsing
   */
  static async getActiveMeetings(): Promise<MeetingData[]> {
    try {
      const { data, error } = await withSupabase((client) =>
        client
          .from("meetings")
          .select(
            "id, meeting_code, title, facilitator_name, facilitator_id, created_at, is_active",
          )
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
      );

      if (error) {
        throw mapSupabaseError(error, "Failed to get active meetings");
      }

      const meetingRows = (data ?? []) as Array<{
        id: string;
        meeting_code: string;
        title: string;
        facilitator_name: string;
        facilitator_id: string | null;
        created_at: string;
        is_active: boolean;
      }>;

      return meetingRows.map((row) => ({
        id: row.id,
        code: row.meeting_code,
        title: row.title,
        facilitator: row.facilitator_name,
        facilitatorId: row.facilitator_id,
        createdAt: row.created_at,
        isActive: row.is_active,
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to get active meetings");
    }
  }

  /**
   * * Get active participants count for a meeting
   */
  static async getParticipants(meetingId: string): Promise<Participant[]> {
    try {
      const { data, error } = await withSupabase((client) =>
        client
          .from("participants")
          .select("*")
          .eq("meeting_id", meetingId)
          .eq("is_active", true)
          .order("joined_at", { ascending: true }),
      );

      if (error) {
        throw mapSupabaseError(error, "Failed to get participants");
      }

      return (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        isFacilitator: p.is_facilitator ?? false,
        hasRaisedHand: false,
        joinedAt: p.joined_at,
        isActive: p.is_active ?? true,
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to get participants");
    }
  }

  /**
   * * Get meetings created by a specific facilitator
   */
  static async getMeetingsByFacilitator(
    facilitatorId: string,
  ): Promise<MeetingData[]> {
    try {
      const { data, error } = await withSupabase((client) =>
        client
          .from("meetings")
          .select("*")
          .eq("facilitator_id", facilitatorId)
          .order("created_at", { ascending: false }),
      );

      if (error) {
        throw mapSupabaseError(error, "Failed to get facilitator meetings");
      }

      return (data || []).map((meeting) => ({
        id: meeting.id,
        code: meeting.meeting_code,
        title: meeting.title,
        facilitator: meeting.facilitator_name,
        facilitatorId: meeting.facilitator_id,
        createdAt: meeting.created_at,
        isActive: meeting.is_active ?? true,
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to get facilitator meetings");
    }
  }

  /**
   * * Delete empty rooms older than 1 hour
   */
  static async deleteEmptyOldRooms(): Promise<void> {
    try {
      // Get meetings that are:
      // 1. is_active = true
      // 2. created_at < NOW() - INTERVAL '1 hour'
      // 3. Have 0 active participants
      const { data: emptyOldMeetings, error: queryError } = await withSupabase(
        (client) =>
          client
            .from("meetings")
            .select(
              `
          id,
          created_at,
          participants!inner(id)
        `,
            )
            .eq("is_active", true)
            .lt(
              "created_at",
              new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            )
            .eq("participants.is_active", false),
      );

      if (queryError) {
        throw mapSupabaseError(
          queryError,
          "Failed to query empty old meetings",
        );
      }

      if (!emptyOldMeetings || emptyOldMeetings.length === 0) {
        return; // No empty old meetings to delete
      }

      // Get meetings with 0 active participants
      const meetingsToDelete: string[] = [];
      for (const meeting of emptyOldMeetings) {
        const { data: activeParticipants, error: participantError } =
          await withSupabase((client) =>
            client
              .from("participants")
              .select("id")
              .eq("meeting_id", meeting.id)
              .eq("is_active", true),
          );

        if (participantError) {
          logProduction("warn", {
            action: "check_participants_failed",
            meetingId: meeting.id,
            error: participantError.message,
          });
          continue;
        }

        if (!activeParticipants || activeParticipants.length === 0) {
          meetingsToDelete.push(meeting.id);
        }
      }

      // Delete the empty old meetings
      if (meetingsToDelete.length > 0) {
        const { error: deleteError } = await withSupabase((client) =>
          client.from("meetings").delete().in("id", meetingsToDelete),
        );

        if (deleteError) {
          throw mapSupabaseError(
            deleteError,
            "Failed to delete empty old meetings",
          );
        }

        logProduction("info", {
          action: "deleted_empty_old_rooms",
          count: meetingsToDelete.length,
          meetingIds: meetingsToDelete,
        });
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to delete empty old rooms");
    }
  }

  /**
   * * Delete a meeting (only by facilitator)
   */
  static async deleteMeeting(
    meetingId: string,
    facilitatorId: string,
  ): Promise<void> {
    try {
      // First check if the user is the facilitator
      const { data: meeting, error: checkError } = await withSupabase(
        (client) =>
          client
            .from("meetings")
            .select("facilitator_id")
            .eq("id", meetingId)
            .single(),
      );

      if (checkError) {
        throw mapSupabaseError(
          checkError,
          "Failed to verify meeting ownership",
        );
      }

      if (meeting.facilitator_id !== facilitatorId) {
        throw new AppError(
          ErrorCode.INSUFFICIENT_PERMISSIONS,
          undefined,
          "Only the meeting facilitator can delete this room",
        );
      }

      // Delete the meeting (this will cascade to participants and speaking queue)
      const { error: deleteError } = await withSupabase((client) =>
        client.from("meetings").delete().eq("id", meetingId),
      );

      if (deleteError) {
        throw mapSupabaseError(deleteError, "Failed to delete meeting");
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapSupabaseError(error, "Failed to delete meeting");
    }
  }
}

// Real-time subscription helpers
export class SupabaseRealtimeService {
  // Subscribe to meeting changes
  static subscribeToMeeting(
    meetingId: string,
    meetingCode: string,
    callbacks: {
      onParticipantsUpdated: (participants: Participant[]) => void;
      onQueueUpdated: (queue: QueueItem[]) => void;
      onMeetingTitleUpdated: (title: string) => void;
      onParticipantJoined: (participant: Participant) => void;
      onParticipantLeft: (participantId: string) => void;
      onNextSpeaker: (speaker: QueueItem) => void;
      onError: (error: Error | unknown) => void;
    },
  ) {
    const participantsChannel = supabase
      .channel(`meeting-${meetingId}-participants`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `meeting_id=eq.${meetingId}`,
        },
        (payload) => {
          void (async () => {
            try {
              const meeting =
                await SupabaseMeetingService.getMeeting(meetingCode);
              if (meeting && callbacks.onParticipantsUpdated) {
                callbacks.onParticipantsUpdated(meeting.participants);

                if (
                  payload.eventType === "INSERT" &&
                  callbacks.onParticipantJoined
                ) {
                  callbacks.onParticipantJoined(
                    meeting.participants[meeting.participants.length - 1],
                  );
                } else if (
                  payload.eventType === "DELETE" &&
                  callbacks.onParticipantLeft
                ) {
                  callbacks.onParticipantLeft(payload.old.id);
                }
              }
            } catch (error) {
              if (callbacks.onError) {
                callbacks.onError(error);
              }
            }
          })();
        },
      );

    const queueChannel = supabase.channel(`meeting-${meetingId}-queue`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "speaking_queue",
        filter: `meeting_id=eq.${meetingId}`,
      },
      (_payload) => {
        void (async () => {
          try {
            const meeting = await SupabaseMeetingService.getMeeting(meetingId);
            if (meeting && callbacks.onQueueUpdated) {
              callbacks.onQueueUpdated(meeting.speakingQueue);
            }
          } catch (error) {
            if (callbacks.onError) {
              callbacks.onError(error);
            }
          }
        })();
      },
    );

    const meetingChannel = supabase.channel(`meeting-${meetingId}-meeting`).on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "meetings",
        filter: `id=eq.${meetingId}`,
      },
      (payload) => {
        void (async () => {
          try {
            if (
              payload.new.title !== payload.old.title &&
              callbacks.onMeetingTitleUpdated
            ) {
              callbacks.onMeetingTitleUpdated(payload.new.title);
            }
          } catch (error) {
            if (callbacks.onError) {
              callbacks.onError(error);
            }
          }
        })();
      },
    );

    // Subscribe to all channels
    void participantsChannel.subscribe();
    void queueChannel.subscribe();
    void meetingChannel.subscribe();

    // Return unsubscribe function
    return () => {
      void participantsChannel.unsubscribe();
      void queueChannel.unsubscribe();
      void meetingChannel.unsubscribe();
    };
  }
}

export default supabase;
