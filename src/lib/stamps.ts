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
 * Whether a stamp counts toward a hackathon, matching the portal's stampbook: a stamp without a
 * hackathon is global and counts everywhere, otherwise the hackathon IDs must match ignoring case
 * @param stamp - the stamp, or just its `hackathon`
 * @param hackathonId - hackathon ID
 */
export const stampBelongsToHackathon = (
  stamp: Pick<Stamp, "hackathon">,
  hackathonId: string,
): boolean => !stamp.hackathon || stamp.hackathon.toLowerCase() === hackathonId.toLowerCase();

/**
 * Reads the stamp IDs one Socials document has unlocked for a hackathon
 *
 * The portal has written `unlockedStamps` three ways over the years: a map keyed by hackathon
 * document ID, a map keyed by hackathon slug, and a flat array with no hackathon at all. All
 * three are read, and every stamp ID is then checked against the stamp's own `hackathon`, so
 * a flat array or slug bucket only counts toward the event its stamps belong to instead of
 * every event sharing that slug, and a stamp moved to another hackathon stops counting here
 * @param unlockedStamps - the raw `unlockedStamps` field off a Socials document
 * @param hackathonId - hackathon ID
 * @param stampsById - every stamp by document ID; an ID missing from it (deleted) is left out
 * @returns the stamp IDs this hacker has collected for the hackathon
 */
export const readUnlockedStamps = (
  unlockedStamps: unknown,
  hackathonId: string,
  stampsById: Map<string, Pick<Stamp, "hackathon">>,
): string[] => {
  let collected: unknown;
  if (Array.isArray(unlockedStamps)) {
    collected = unlockedStamps;
  } else if (unlockedStamps && typeof unlockedStamps === "object") {
    const byHackathon = unlockedStamps as Record<string, unknown>;
    collected = byHackathon[hackathonId] ?? byHackathon[getHackathonType(hackathonId)];
  }

  const ids = Array.isArray(collected)
    ? collected.map(String)
    : collected && typeof collected === "object"
      ? Object.entries(collected)
          .filter(([, unlocked]) => Boolean(unlocked))
          .map(([stampId]) => stampId)
      : [];

  return ids.filter((stampId) => {
    const stamp = stampsById.get(stampId);
    return stamp !== undefined && stampBelongsToHackathon(stamp, hackathonId);
  });
};
