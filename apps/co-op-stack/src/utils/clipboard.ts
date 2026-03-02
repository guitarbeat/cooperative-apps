/**
 * Copy a meeting link to clipboard
 */
export const copyMeetingLink = async (
  code: string,
  mode: "join" | "watch" = "join"
): Promise<string> => {
  const link = `${window.location.origin}/meeting?mode=${mode}&code=${code}`;
  await navigator.clipboard.writeText(link);
  return link;
};
