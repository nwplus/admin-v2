import {
  collection,
  getDocs,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client.ts";
import type { Applicant, BlacklistEntry, BlacklistMatch } from "@/lib/firebase/types";

/**
 * Firestore path for the global blacklist collection (must be at subcollection level entries).
 */
const BLACKLIST_COLLECTION = "Hackathons/blacklist/entries";

// ── One-shot fetch ────────────────────────────────────────────────────────────

/**
 * Fetches all blacklist entries once.
 * Returns an empty array (and logs the error) if the fetch fails,
 * so callers never crash the portal.
 */
export async function getBlacklistEntries(): Promise<BlacklistEntry[]> {
  try {
    const snap = await getDocs(collection(db, BLACKLIST_COLLECTION));
    return snap.docs.map((doc) => doc.data() as BlacklistEntry);
  } catch (err) {
    console.error("[blacklist] Failed to fetch blacklist entries:", err);
    return [];
  }
}

// ── Real-time subscription ────────────────────────────────────────────────────

/**
 * Subscribes to real-time updates of the blacklist collection.
 *
 * @param onUpdate  Callback invoked with the full entries array on every change.
 * @param onError   Optional non-fatal error callback — UI stays up with stale data.
 * @returns         Firestore unsubscribe function — call on unmount.
 */
export function subscribeToBlacklist(
  onUpdate: (entries: BlacklistEntry[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, BLACKLIST_COLLECTION),
    (snap) => {
      const entries = snap.docs.map((doc) => doc.data() as BlacklistEntry);
      onUpdate(entries);
    },
    (err) => {
      console.error("[blacklist] Snapshot error:", err);
      onError?.(err);
      // Never re-throw — keep the portal running with empty / stale entries.
    },
  );
}

// ── Matching ──────────────────────────────────────────────────────────────────

/**
 * Client-side O(n * m) exact case-insensitive email match.
 * Builds a Map from the blacklist first, making each applicant lookup O(1).
 * Does NOT mutate any applicant document.
 *
 * @param applicants  Full applicant list from the Firestore subscription.
 * @param entries     Current blacklist entries.
 * @returns           One BlacklistMatch per matched applicant.
 */
export function matchApplicantsToBlacklist(
  applicants: Applicant[],
  entries: BlacklistEntry[],
): BlacklistMatch[] {
  if (!entries.length) return [];

  // O(m) build; O(1) per lookup thereafter
  const entryMap = new Map<string, BlacklistEntry>();
  for (const entry of entries) {
    entryMap.set(entry.email.toLowerCase().trim(), entry);
  }

  const matches: BlacklistMatch[] = [];

  for (const applicant of applicants) {
    const rawEmail = applicant.basicInfo?.email ?? "";
    const normalisedEmail = rawEmail.toLowerCase().trim();
    const matched = entryMap.get(normalisedEmail);
    if (!matched) continue;

    const firstName =
      applicant.basicInfo?.preferredName ??
      applicant.basicInfo?.firstName ??
      applicant.basicInfo?.legalFirstName ??
      "";
    const lastName =
      applicant.basicInfo?.lastName ??
      applicant.basicInfo?.legalLastName ??
      "";

    matches.push({
      applicantId: applicant._id,
      applicantName: `${firstName} ${lastName}`.trim(),
      email: normalisedEmail,
      entry: matched,
    });
  }

  return matches;
}