import type { Stamp, StampCategory } from "@/lib/firebase/types";
import { getHackathonType } from "@/lib/utils";

export const SOCIALS_NAME_FALLBACK = "User";

export const STAMP_CATEGORIES: { value: StampCategory; label: string }[] = [
  { value: "preHackathonWorkshop", label: "Pre-Hackathon Workshop" },
  { value: "dayOfWorkshop", label: "Day-Of Workshop" },
  { value: "dayOfActivity", label: "Day-Of Activity" },
  { value: "other", label: "Other" },
];

export const STAMP_CATEGORY_LABELS = Object.fromEntries(
  STAMP_CATEGORIES.map(({ value, label }) => [value, label]),
) as Record<StampCategory, string>;

/**
 * Whether a stamp's QR image has to be regenerated
 *
 * The QR encodes `.../{hackathonSlug}/stampbook?unlockStamp={stampId}`, so moving a
 * stamp to a hackathon with a different portal slug (for example reusing an nwHacks
 * stamp for HackCamp) invalidates the QR already in storage.
 *
 * @param activeStamp - the stamp being edited, if any
 * @param values - the submitted form values
 * @returns true when a new QR image should be generated
 */
export const needsStampQrRegeneration = (
  activeStamp: Pick<Stamp, "hackathon" | "isQRUnlockable"> | null | undefined,
  values: Pick<Stamp, "hackathon" | "isQRUnlockable">,
): boolean => {
  if (!values.isQRUnlockable) return false;
  if (!activeStamp?.isQRUnlockable) return true;

  return getHackathonType(activeStamp.hackathon ?? "") !== getHackathonType(values.hackathon ?? "");
};

/**
 * Reads the stamp IDs one Socials document has unlocked for a hackathon
 *
 * The portal has written this field three different ways over the years, so all are read:
 * a flat array, a map keyed by hackathon document ID, and a map keyed by hackathon slug
 * @param unlockedStamps - the raw `unlockedStamps` field off a Socials document
 * @param hackathonId - hackathon ID
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
