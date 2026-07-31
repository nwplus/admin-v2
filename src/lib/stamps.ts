import { getHackathonType } from "@/lib/utils";

/**
 * Reads the stamp IDs one Socials document has unlocked for a hackathon
 *
 * Interestingly, the portal has written this field a few different ways, so we read all
 * the following:
 * - a flat array
 * - a map keyed by hackathon document ID
 * - a map keyed by hackathon slug
 *
 * @param unlockedStamps the raw `unlockedStamps` field off a Socials document
 * @param hackathonId hackathon ID
 * @returns the stamp IDs this hacker has collected for the hackathon
 */
export const readUnlockedStamps = (unlockedStamps: unknown, hackathonId: string): string[] => {
  if (Array.isArray(unlockedStamps)) return unlockedStamps.map(String);
  if (!unlockedStamps || typeof unlockedStamps !== "object") return [];

  const byHackathon = unlockedStamps as Record<string, unknown>;
  const collected = byHackathon[hackathonId] ?? byHackathon[getHackathonType(hackathonId)];

  if (Array.isArray(collected)) return collected.map(String);
  if (collected && typeof collected === "object") {
    return Object.entries(collected)
      .filter(([, unlocked]) => Boolean(unlocked))
      .map(([stampId]) => stampId);
  }

  return [];
};
