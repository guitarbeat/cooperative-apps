import { z } from "zod";

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(50, "Name must be 50 characters or less")
  .regex(
    /^[\p{L}\p{N}\s\-']+$/u,
    "Only letters, numbers, spaces, hyphens, and apostrophes",
  );

export const roomCodeSchema = z
  .string()
  .length(6, "Room code must be 6 characters")
  .regex(/^[A-Za-z0-9]+$/, "Only letters and numbers");

export const titleSchema = z
  .string()
  .min(3, "Title must be at least 3 characters")
  .max(100, "Title must be 100 characters or less");

/**
 * Validates and normalizes a meeting code using roomCodeSchema.
 * Drop-in replacement for legacy validateMeetingCode.
 */
export function validateMeetingCode(code: string): {
  isValid: boolean;
  normalizedCode: string;
  error: string | null;
} {
  if (!code || typeof code !== "string") {
    return {
      isValid: false,
      normalizedCode: "",
      error: "Meeting code is required",
    };
  }

  const normalizedCode = code.toUpperCase().trim();
  const result = roomCodeSchema.safeParse(normalizedCode);

  if (!result.success) {
    return {
      isValid: false,
      normalizedCode,
      error: result.error.errors[0]?.message ?? "Invalid meeting code",
    };
  }

  return { isValid: true, normalizedCode, error: null };
}
