import type { RaffleEntrant, RafflePrize, RaffleWinner } from "@/lib/firebase/types";
import { type HackerStampEntry, SOCIALS_NAME_FALLBACK } from "@/lib/stamps";

export type StampEntry = Pick<HackerStampEntry, "displayName" | "email">;

export interface ApplicantName {
  preferredName?: string;
  lastName?: string;
}

/**
 * Aggregates collected stamps into one entrant per hacker, where each stamp is one raffle entry
 *
 * @param stampEntries one element per stamp collected, as returned by `fetchHackersWithStamps`
 * @param applicantNames lowercased email to applicant name fields, used to recover last names
 * @returns the raffle pool, one entrant per hacker
 */
export const buildRaffleEntrants = (
  stampEntries: StampEntry[],
  applicantNames: Map<string, ApplicantName>,
): RaffleEntrant[] => {
  const entrants = new Map<string, RaffleEntrant>();

  for (const entry of stampEntries) {
    const email = entry.email.trim().toLowerCase();
    if (!email) continue;

    const existing = entrants.get(email);
    if (existing) {
      existing.entries += 1;
      continue;
    }

    const applicant = applicantNames.get(email);
    const socialsName = entry.displayName?.trim();
    const preferredName =
      socialsName && socialsName !== SOCIALS_NAME_FALLBACK
        ? socialsName
        : (applicant?.preferredName ?? SOCIALS_NAME_FALLBACK);

    entrants.set(email, {
      email,
      preferredName,
      lastName: applicant?.lastName ?? "",
      entries: 1,
    });
  }

  return [...entrants.values()];
};

/**
 * Total number of raffle entries across the pool
 * @param entrants the raffle pool
 * @returns the sum of every entrant's entries
 */
export const totalEntries = (entrants: RaffleEntrant[]): number =>
  entrants.reduce((sum, entrant) => sum + entrant.entries, 0);

/**
 * Draws one winner, weighted so that a hacker with N stamps is N times as likely to win
 *
 * @param entrants the raffle pool
 * @returns the drawn entrant, or null when the pool has no entries
 */
export const pickWeightedWinner = (entrants: RaffleEntrant[]): RaffleEntrant | null => {
  const total = totalEntries(entrants);
  if (total <= 0) return null;

  let threshold = Math.random() * total;
  for (const entrant of entrants) {
    threshold -= entrant.entries;
    if (threshold < 0) return entrant;
  }

  return entrants[entrants.length - 1] ?? null;
};

const winnersForPrize = (winners: RaffleWinner[], prizeId?: string) =>
  winners.filter((winner) => winner.prizeId === prizeId);

/**
 * How many winners have been logged for a prize
 *
 * @param winners every winner logged so far
 * @param prizeId the prize to count winners for
 * @returns the number of the prize's slots that are claimed
 */
export const drawnCountForPrize = (winners: RaffleWinner[], prizeId?: string): number =>
  winnersForPrize(winners, prizeId).length;

/**
 * How many of a prize are still left to draw
 *
 * @param prize the prize to count
 * @param winners every winner logged so far
 * @returns the number of unclaimed slots, never below zero
 */
export const remainingForPrize = (prize: RafflePrize, winners: RaffleWinner[]): number =>
  Math.max(prize.quantity - drawnCountForPrize(winners, prize._id), 0);

/**
 * Drops the hackers who have already won this prize, so nobody wins the same prize twice
 *
 * @param entrants the raffle pool
 * @param winners every winner logged so far
 * @param prizeId the prize about to be drawn for
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
 *
 * @param winners every winner logged so far
 * @param prizeId the prize about to be drawn for
 * @returns the slot index to claim
 */
export const nextPrizeSlot = (winners: RaffleWinner[], prizeId: string): number => {
  const taken = new Set(winnersForPrize(winners, prizeId).map((winner) => winner.slot));

  let slot = 0;
  while (taken.has(slot)) slot++;
  return slot;
};

/**
 * Escapes a CSV field by quoting it and doubling any embedded quotes
 */
const csvField = (value: string | number): string => `"${String(value).replace(/"/g, '""')}"`;

/**
 * Builds the winners log as CSV, with a header row and fully escaped fields
 *
 * @param winners the winners to export, in the order they should appear
 * @returns CSV content ready for `downloadCSV`
 */
export const generateWinnersCSV = (winners: RaffleWinner[]): string => {
  const header = ["Prize", "Preferred Name", "Last Name", "Email", "Entries", "Drawn At"];
  const rows = winners.map((winner) =>
    [
      winner.prizeName,
      winner.preferredName,
      winner.lastName,
      winner.email,
      winner.entryCount,
      winner.drawnAt?.toDate().toLocaleString() ?? "",
    ]
      .map(csvField)
      .join(","),
  );

  return [header.map(csvField).join(","), ...rows].join("\n");
};
