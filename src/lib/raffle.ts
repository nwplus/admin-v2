import type { RaffleEntrant, RaffleWinner } from "@/lib/firebase/types";

export interface StampEntry {
  displayName: string;
  email: string;
}

export interface ApplicantName {
  preferredName?: string;
  lastName?: string;
}

const SOCIALS_NAME_FALLBACK = "User";

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
  if (total <= 0) 
    return null;

  let threshold = Math.random() * total;
  for (const entrant of entrants) {
    threshold -= entrant.entries;
    if (threshold < 0) return entrant;
  }

  return entrants[entrants.length - 1] ?? null;
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
