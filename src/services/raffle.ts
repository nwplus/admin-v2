import { auth, db } from "@/lib/firebase/client";
import type {
  Applicant,
  CtfSolve,
  RaffleEntrant,
  RafflePrize,
  RaffleWinner,
} from "@/lib/firebase/types";
import {
  type ApplicantName,
  buildRaffleEntrants,
  stampPointsById,
  sumCtfPointsByEmail,
} from "@/lib/raffle";
import { fetchHackersWithStamps, fetchStamps } from "@/services/stamps";
import {
  type DocumentReference,
  type FirestoreError,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
} from "firebase/firestore";

/**
 * Thrown when another organizer's draw claimed the prize slot first
 */
export class RaffleSlotTakenError extends Error {
  constructor() {
    super("This prize slot was already claimed by another draw");
    this.name = "RaffleSlotTakenError";
  }
}

/**
 * Utility function that returns a hackathon's raffle prizes as realtime data
 * @param hackathon - hackathon ID
 * @param callback - the function used to ingest the data
 * @param onError - called when the subscription fails, so the page can say so rather than
 *  looking like a hackathon with no prizes set up
 * @returns a function to be called on dismount
 */
export const subscribeToRafflePrizes = (
  hackathon: string,
  callback: (docs: RafflePrize[]) => void,
  onError?: (error: FirestoreError) => void,
) =>
  onSnapshot(
    query(collection(db, "Hackathons", hackathon, "RafflePrizes")),
    (querySnapshot) => {
      const prizes: RafflePrize[] = [];
      for (const prizeDoc of querySnapshot.docs) {
        prizes.push({ ...(prizeDoc.data() as unknown as RafflePrize), _id: prizeDoc.id });
      }
      prizes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
      callback(prizes);
    },
    (error) => {
      console.error("Error fetching raffle prizes:", error);
      callback([]);
      onError?.(error);
    },
  );

/**
 * Utility function that updates or adds a raffle prize, depending on if an id argument is passed
 * @param hackathon - hackathon ID
 * @param prize - the prize to upsert
 * @param id - optional existing prize ID for updates
 * @returns the upserted prize document ref
 */
export const upsertRafflePrize = async (
  hackathon: string,
  prize: RafflePrize,
  id?: string,
): Promise<DocumentReference | null> => {
  try {
    const prizeId = id ?? doc(collection(db, "Hackathons", hackathon, "RafflePrizes")).id;
    const prizeRef = doc(db, "Hackathons", hackathon, "RafflePrizes", prizeId);

    await setDoc(
      prizeRef,
      {
        name: prize.name,
        quantity: prize.quantity,
        order: prize.order ?? 0,
        lastModified: Timestamp.now(),
        lastModifiedBy: auth.currentUser?.email ?? "",
      },
      { merge: true },
    );
    return prizeRef;
  } catch (error) {
    console.error("Error upserting raffle prize:", error);
    return null;
  }
};

/**
 * Deletes a raffle prize
 * @param hackathon - hackathon ID
 * @param id - the ID of the prize to delete
 */
export const deleteRafflePrize = async (hackathon: string, id: string) => {
  if (!id) return;
  try {
    await deleteDoc(doc(db, "Hackathons", hackathon, "RafflePrizes", id));
  } catch (error) {
    console.error("Error deleting raffle prize:", error);
    throw error;
  }
};

/**
 * Utility function that returns a hackathon's raffle winners as realtime data, newest first
 * @param hackathon - hackathon ID
 * @param callback - the function used to ingest the data
 * @param onError - called when the subscription fails, so a draw is never run against a
 *  winners log that only looks empty
 * @returns a function to be called on dismount
 */
export const subscribeToRaffleWinners = (
  hackathon: string,
  callback: (docs: RaffleWinner[]) => void,
  onError?: (error: FirestoreError) => void,
) =>
  onSnapshot(
    query(collection(db, "Hackathons", hackathon, "RaffleWinners"), orderBy("drawnAt", "desc")),
    (querySnapshot) => {
      const winners: RaffleWinner[] = [];
      for (const winnerDoc of querySnapshot.docs) {
        winners.push({ ...(winnerDoc.data() as unknown as RaffleWinner), _id: winnerDoc.id });
      }
      callback(winners);
    },
    (error) => {
      console.error("Error fetching raffle winners:", error);
      callback([]);
      onError?.(error);
    },
  );

/**
 * Logs a confirmed raffle winner into one of the prize's slots
 * @param hackathon - hackathon ID
 * @param winner - the winner to log
 * @param slot - the prize slot to claim, from `nextPrizeSlot`
 * @returns the created winner document ref
 * @throws RaffleSlotTakenError when another draw already claimed the slot
 */
export const addRaffleWinner = async (
  hackathon: string,
  winner: RaffleWinner,
  slot: number,
): Promise<DocumentReference | null> => {
  const winnerRef = doc(db, "Hackathons", hackathon, "RaffleWinners", `${winner.prizeId}_${slot}`);

  try {
    await runTransaction(db, async (transaction) => {
      const claimed = await transaction.get(winnerRef);
      if (claimed.exists()) throw new RaffleSlotTakenError();

      transaction.set(winnerRef, {
        prizeId: winner.prizeId,
        prizeName: winner.prizeName,
        preferredName: winner.preferredName,
        lastName: winner.lastName,
        email: winner.email,
        entryCount: winner.entryCount,
        slot,
        drawnAt: Timestamp.now(),
        drawnBy: auth.currentUser?.email ?? "",
      });
    });
    return winnerRef;
  } catch (error) {
    if (error instanceof RaffleSlotTakenError) throw error;
    console.error("Error adding raffle winner:", error);
    return null;
  }
};

/**
 * Deletes a logged raffle winner, for undoing a mislogged draw
 * @param hackathon - hackathon ID
 * @param id - the ID of the winner to delete
 */
export const deleteRaffleWinner = async (hackathon: string, id: string) => {
  if (!id) return;
  try {
    await deleteDoc(doc(db, "Hackathons", hackathon, "RaffleWinners", id));
  } catch (error) {
    console.error("Error deleting raffle winner:", error);
    throw error;
  }
};

// applicant names rarely change mid-event, so they are cached for the page lifetime
const applicantNameCache = new Map<string, Map<string, ApplicantName>>();

/**
 * Fetches the name fields we can recover for each applicant, keyed by lowercased email
 * @param hackathon - hackathon ID
 * @param refresh - re-reads the Applicants collection instead of using the cached names
 * @returns a map of lowercased email to applicant name fields
 */
const fetchApplicantNames = async (
  hackathon: string,
  refresh = false,
): Promise<Map<string, ApplicantName>> => {
  const cached = applicantNameCache.get(hackathon);
  if (cached && !refresh) return cached;

  const names = new Map<string, ApplicantName>();
  const snapshot = await getDocs(collection(db, "Hackathons", hackathon, "Applicants"));

  for (const applicantDoc of snapshot.docs) {
    const { basicInfo } = applicantDoc.data() as unknown as Applicant;
    const email = basicInfo?.email?.trim().toLowerCase();
    if (!email) continue;

    names.set(email, {
      preferredName: basicInfo.preferredName || basicInfo.firstName || basicInfo.legalFirstName,
      lastName: basicInfo.legalLastName || basicInfo.lastName,
    });
  }

  applicantNameCache.set(hackathon, names);
  return names;
};

/**
 * Totals CTF points per hacker from the portal's CTF solves
 * @param hackathon - hackathon ID
 * @returns lowercased email to total CTF points
 */
export const fetchCtfPointsByEmail = async (hackathon: string): Promise<Map<string, number>> => {
  const snapshot = await getDocs(collection(db, "Hackathons", hackathon, "CtfSolves"));
  return sumCtfPointsByEmail(snapshot.docs.map((solveDoc) => solveDoc.data() as CtfSolve));
};

/**
 * Builds the raffle pool for a hackathon, where each point is one entry: the point value of
 * every stamp a hacker collected plus their CTF points
 * @param hackathon - hackathon ID
 * @param refreshNames - re-reads applicant names as well as stamps, for an explicit refresh
 * @returns the raffle pool, one entrant per hacker with at least one point
 */
export const fetchRaffleEntrants = async (
  hackathon: string,
  refreshNames = false,
): Promise<RaffleEntrant[]> => {
  const [stampEntries, stamps, applicantNames, ctfPoints] = await Promise.all([
    fetchHackersWithStamps(hackathon),
    fetchStamps(),
    fetchApplicantNames(hackathon, refreshNames),
    fetchCtfPointsByEmail(hackathon),
  ]);

  return buildRaffleEntrants(stampEntries, stampPointsById(stamps), applicantNames, ctfPoints);
};
