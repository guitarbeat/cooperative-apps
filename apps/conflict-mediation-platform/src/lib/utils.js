import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Helper to check if we are in development mode
// This is useful for conditional logic that depends on the environment
// and can be mocked in tests.
export const isDev = () => import.meta.env.DEV;
