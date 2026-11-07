import type {
  CtfSolve,
  HackerStampEntry,
  RaffleEntrant,
  RafflePrize,
  RaffleWinner,
  Stamp,
} from "@/lib/firebase/types";
import { stampPointValue } from "@/lib/points";
import { SOCIALS_NAME_FALLBACK } from "@/lib/stamps";
import { ORGANIZER_EMAIL_DOMAIN, isHackathonEvent, splitHackathon } from "@/lib/utils";

export type StampEntry = Pick<HackerStampEntry, "displayName" | "email" | "stampId">;

export interface ApplicantName {
  preferredName?: string;
  lastName?: string;
}

/**
 * Looks up each stamp's point value by ID, whatever hackathon the stamp belongs to
 * @param stamps - every stamp, unfiltered
 * @returns stamp ID to point value; a stamp ID missing from the map (deleted) is worth 0
 */
export const stampPointsById = (stamps: Pick<Stamp, "_id" | "points">[]): Map<string, number> => {
  const values = new Map<string, number>();
  for (const stamp of stamps) {
    if (stamp._id) values.set(stamp._id, stampPointValue(stamp));
  }
  return values;
};

/**
 * Aggregates collected stamps and CTF points into one entrant per hacker, where each point is
 * one raffle entry
 * @param stampEntries - one element per stamp collected, as returned by `fetchHackersWithStamps`
 * @param stampPoints - stamp ID to point value, from `stampPointsById`; unknown stamps count 0
 * @param applicantNames - lowercased email to applicant name fields, used to recover last names
 * @param ctfPoints - email to CTF points, from `sumCtfPointsByEmail`
 * @returns the raffle pool, one entrant per hacker with at least one point
 */
export const buildRaffleEntrants = (
  stampEntries: StampEntry[],
  stampPoints: Map<string, number>,
  applicantNames: Map<string, ApplicantName>,
  ctfPoints: Map<string, number> = new Map(),
): RaffleEntrant[] => {
  const entrants = new Map<string, RaffleEntrant>();

  const addEntries = (rawEmail: string, displayName: string | undefined, count: number) => {
    const email = rawEmail.trim().toLowerCase();
    if (!email || !Number.isFinite(count) || count <= 0) return;

    const existing = entrants.get(email);
    if (existing) {
      existing.entries += count;
      return;
    }

    const applicant = applicantNames.get(email);
    const socialsName = displayName?.trim();
    const preferredName =
      socialsName && socialsName !== SOCIALS_NAME_FALLBACK
        ? socialsName
        : (applicant?.preferredName ?? SOCIALS_NAME_FALLBACK);

    entrants.set(email, {
      email,
      preferredName,
      lastName: applicant?.lastName ?? "",
      entries: count,
    });
  };

  // a stamp counts once per hacker, however many times it appears
  const counted = new Set<string>();
  for (const entry of stampEntries) {
    const key = `${entry.email.trim().toLowerCase()}\u0000${entry.stampId}`;
    if (counted.has(key)) continue;
    counted.add(key);
    addEntries(entry.email, entry.displayName, stampPoints.get(entry.stampId) ?? 0);
  }
  for (const [email, points] of ctfPoints) addEntries(email, undefined, points);

  return [...entrants.values()];
};

/**
 * Totals each hacker's CTF points across their solves, keyed the same way as raffle entrants
 * @param solves - every CtfSolves doc for the hackathon
 * @returns lowercased email to total CTF points
 */
export const sumCtfPointsByEmail = (
  solves: Pick<CtfSolve, "email" | "points">[],
): Map<string, number> => {
  const points = new Map<string, number>();

  for (const solve of solves) {
    const email = solve.email?.trim().toLowerCase();
    if (!email) continue;
    if (typeof solve.points !== "number" || !Number.isFinite(solve.points)) continue;
    points.set(email, (points.get(email) ?? 0) + solve.points);
  }

  return points;
};

/**
 * Whether an email belongs to an organizer account, which must never win a hacker prize
 * @param email - any casing, with or without surrounding whitespace
 * @returns true for the organizer domain or any subdomain of it
 */
export const isOrganizerEmail = (email: string): boolean => {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at < 0) return false;

  const domain = trimmed.slice(at + 1);
  return domain === ORGANIZER_EMAIL_DOMAIN || domain.endsWith(`.${ORGANIZER_EMAIL_DOMAIN}`);
};

/**
 * Separates organizer accounts out of the raffle pool so the draw can skip them and the page
 * can say how many were skipped
 * @param entrants - the raffle pool, organizers included
 * @returns the hackers to draw from and the organizers removed
 */
export const splitOrganizers = (
  entrants: RaffleEntrant[],
): { hackers: RaffleEntrant[]; organizers: RaffleEntrant[] } => {
  const hackers: RaffleEntrant[] = [];
  const organizers: RaffleEntrant[] = [];
  for (const entrant of entrants) {
    (isOrganizerEmail(entrant.email) ? organizers : hackers).push(entrant);
  }
  return { hackers, organizers };
};

/** The month each hackathon usually runs in, 1-12, by lowercased name, for guessing the current event */
const SEASON_MONTH: Record<string, number> = { hackcamp: 11, nwhacks: 1, "cmd-f": 3 };

/**
 * Picks the hackathon the raffle should open on: the CMS's `activeHackathon` when it is one of
 * the listed events, otherwise the event whose usual month is closest to now, so HackCamp wins
 * in November even once next year's nwHacks exists. Events whose season is unknown only win
 * when nothing else is there, newest first
 * @param hackathonIds - every hackathon document ID, events or not
 * @param activeHackathon - the CMS's `activeHackathon` flag, if it could be read
 * @param now - the current date, injectable for tests
 * @returns the chosen hackathon ID, or "" when there are no events
 */
export const defaultRaffleHackathon = (
  hackathonIds: string[],
  activeHackathon?: string,
  now: Date = new Date(),
): string => {
  const events = hackathonIds.filter(isHackathonEvent);
  if (activeHackathon && events.includes(activeHackathon)) return activeHackathon;

  const nowMonths = now.getFullYear() * 12 + now.getMonth() + 1;
  const ranked = events
    .map((id) => {
      const [name, year] = splitHackathon(id);
      const month = SEASON_MONTH[name.toLowerCase()];
      const eventMonths = month === undefined ? undefined : Number(year) * 12 + month;
      return {
        id,
        year: Number(year),
        distance:
          eventMonths === undefined ? Number.POSITIVE_INFINITY : Math.abs(eventMonths - nowMonths),
        // on a tie between a just-finished and an upcoming event, prefer the upcoming one
        eventMonths: eventMonths ?? 0,
      };
    })
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        b.eventMonths - a.eventMonths ||
        b.year - a.year ||
        a.id.localeCompare(b.id),
    );

  return ranked[0]?.id ?? "";
};

/**
 * Sums every entrant's entries across the pool
 */
export const totalEntries = (entrants: RaffleEntrant[]): number =>
  entrants.reduce((sum, entrant) => sum + entrant.entries, 0);

/**
 * A uniform random number in [0, 1) from the platform's cryptographic generator, so a draw can't
 * be predicted or steered the way a seeded `Math.random` could; falls back to `Math.random`
 * only where `crypto` is unavailable
 */
export const secureRandom = (): number => {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) return Math.random();
  return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
};

/**
 * Draws one winner, weighted so that a hacker with N points is N times as likely to win
 * @param entrants - the raffle pool
 * @param random - a source of uniform numbers in [0, 1), injectable for tests
 * @returns the drawn entrant, or null when the pool has no entries
 */
export const pickWeightedWinner = (
  entrants: RaffleEntrant[],
  random: () => number = secureRandom,
): RaffleEntrant | null => {
  const total = totalEntries(entrants);
  if (total <= 0) return null;

  let threshold = random() * total;
  for (const entrant of entrants) {
    threshold -= entrant.entries;
    if (threshold < 0) return entrant;
  }

  return entrants[entrants.length - 1] ?? null;
};

const winnersForPrize = (winners: RaffleWinner[], prizeId?: string) =>
  winners.filter((winner) => winner.prizeId === prizeId);

/**
 * Counts how many of a prize's slots are already claimed
 */
export const drawnCountForPrize = (winners: RaffleWinner[], prizeId?: string): number =>
  winnersForPrize(winners, prizeId).length;

/**
 * Counts a prize's unclaimed slots, never below zero
 */
export const remainingForPrize = (prize: RafflePrize, winners: RaffleWinner[]): number =>
  Math.max(prize.quantity - drawnCountForPrize(winners, prize._id), 0);

/**
 * Drops the hackers who have already won this prize, so nobody wins the same prize twice
 * @param entrants - the raffle pool
 * @param winners - every winner logged so far
 * @param prizeId - the prize about to be drawn for
 * @returns the entrants still eligible for this prize
 */
export const entrantsEligibleForPrize = (
  entrants: RaffleEntrant[],
  winners: RaffleWinner[],
  prizeId?: string,
): RaffleEntrant[] => {
  if (!prizeId) return entrants;

  const alreadyWon = new Set(
    winnersForPrize(winners, prizeId).map((winner) => winner.email.trim().toLowerCase()),
  );

  if (alreadyWon.size === 0) return entrants;
  return entrants.filter((entrant) => !alreadyWon.has(entrant.email));
};

/**
 * Picks the slot a new winner should claim for a prize
 * @param winners - every winner logged so far
 * @param prizeId - the prize about to be drawn for
 * @returns the lowest slot index not already taken
 */
export const nextPrizeSlot = (winners: RaffleWinner[], prizeId: string): number => {
  const taken = new Set(winnersForPrize(winners, prizeId).map((winner) => winner.slot));

  let slot = 0;
  while (taken.has(slot)) slot++;
  return slot;
};

/** Escapes a CSV field by quoting it and doubling any embedded quotes */
const csvField = (value: string | number): string => `"${String(value).replace(/"/g, '""')}"`;

/**
 * Builds the winners log as CSV, with a header row and fully escaped fields
 * @param winners - the winners to export, in the order they should appear
 * @returns CSV content ready for `downloadCSV`
 */
export const generateWinnersCSV = (winners: RaffleWinner[]): string => {
  const header = [
    "Prize",
    "Preferred Name",
    "Last Name",
    "Email",
    "Entries",
    "Pool Entries",
    "Pool Size",
    "Drawn At",
  ];
  const rows = winners.map((winner) =>
    [
      winner.prizeName,
      winner.preferredName,
      winner.lastName,
      winner.email,
      winner.entryCount,
      winner.poolEntries ?? "",
      winner.poolSize ?? "",
      winner.drawnAt?.toDate().toLocaleString() ?? "",
    ]
      .map(csvField)
      .join(","),
  );

  return [header.map(csvField).join(","), ...rows].join("\n");
};
