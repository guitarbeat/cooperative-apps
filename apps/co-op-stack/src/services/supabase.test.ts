import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseMeetingService } from "./supabase";
import { ErrorCode, AppError } from "../utils/errorHandling";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
  executeSupabase: vi.fn(),
  supabase: {
    from: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      })),
    })),
  },
}));

describe("SupabaseMeetingService Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createMeeting", () => {
    it("throws error for empty title", async () => {
      try {
        await SupabaseMeetingService.createMeeting("", "Facilitator");
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).details.code).toBe(
          ErrorCode.INVALID_MEETING_TITLE,
        );
      }
    });

    it("throws error for short title", async () => {
      try {
        await SupabaseMeetingService.createMeeting("ab", "Facilitator");
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).details.code).toBe(
          ErrorCode.INVALID_MEETING_TITLE,
        );
      }
    });

    it("throws error for long title", async () => {
      const longTitle = "a".repeat(101);
      try {
        await SupabaseMeetingService.createMeeting(longTitle, "Facilitator");
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).details.code).toBe(
          ErrorCode.INVALID_MEETING_TITLE,
        );
      }
    });

    it("throws error for invalid facilitator name", async () => {
      // Name too long
      const longName = "a".repeat(51);
      try {
        await SupabaseMeetingService.createMeeting("Valid Title", longName);
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).details.code).toBe(
          ErrorCode.INVALID_PARTICIPANT_NAME,
        );
      }

      // Name empty
      try {
        await SupabaseMeetingService.createMeeting("Valid Title", "");
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).details.code).toBe(
          ErrorCode.INVALID_PARTICIPANT_NAME,
        );
      }
    });
  });

  describe("joinMeeting", () => {
    it("throws error for invalid meeting code", async () => {
      try {
        await SupabaseMeetingService.joinMeeting("INV", "User");
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).details.code).toBe(
          ErrorCode.INVALID_MEETING_CODE,
        );
      }
    });

    it("throws error for invalid participant name", async () => {
      try {
        await SupabaseMeetingService.joinMeeting("ABCDEF", "");
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).details.code).toBe(
          ErrorCode.INVALID_PARTICIPANT_NAME,
        );
      }
    });

    it("throws error for invalid participant name characters", async () => {
      try {
        await SupabaseMeetingService.joinMeeting("ABCDEF", "<script>");
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).details.code).toBe(
          ErrorCode.INVALID_PARTICIPANT_NAME,
        );
      }
    });

    it("accepts valid international participant name", async () => {
      // This should proceed past validation and fail at API call (since mocked API returns nothing/undefined)
      try {
        await SupabaseMeetingService.joinMeeting("ABCDEF", "Jürgen");
      } catch (e) {
        // Should NOT be validation error
        if (e instanceof AppError) {
          expect(e.details.code).not.toBe(ErrorCode.INVALID_PARTICIPANT_NAME);
        }
      }
    });
  });

  describe("updateMeetingTitle", () => {
    it("throws error for invalid title", async () => {
      try {
        await SupabaseMeetingService.updateMeetingTitle("meeting-id", "");
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).details.code).toBe(
          ErrorCode.INVALID_MEETING_TITLE,
        );
      }
    });
  });

  describe("updateParticipantName", () => {
    it("throws error for invalid name", async () => {
      try {
        await SupabaseMeetingService.updateParticipantName(
          "participant-id",
          "",
        );
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).details.code).toBe(
          ErrorCode.INVALID_PARTICIPANT_NAME,
        );
      }
    });
  });

  describe("updateMeetingCode", () => {
    it("throws error for invalid meeting code", async () => {
      try {
        await SupabaseMeetingService.updateMeetingCode("meeting-id", "INVALID"); // Too long
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).details.code).toBe(
          ErrorCode.INVALID_MEETING_CODE,
        );
      }
    });
  });
});
