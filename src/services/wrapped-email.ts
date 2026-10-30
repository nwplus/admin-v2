import { db } from "@/lib/firebase/client";
import type { Hackathon, WrappedEmailLedger } from "@/lib/firebase/types";
import {
  collection,
  deleteField,
  doc,
  getCountFromServer,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

export type WrappedSettings = NonNullable<Hackathon["wrapped"]>;

// Must match the Functions-new recipient query.
const recipientsQuery = (hackathonId: string) =>
  query(
    collection(db, "Hackathons", hackathonId, "Applicants"),
    where("status.applicationStatus", "==", "acceptedAndAttending"),
    where("dayOf.checkedIn", "==", true),
  );

/**
 * Default link to a hacker's Wrapped in the portal, e.g. HackCamp2025 → {portal}/hackcamp/wrapped
 * @param hackathonId - the hackathon document ID
 * @param projectId - the Firebase project ID; production uses the live portal
 */
export const getDefaultWrappedUrl = (
  hackathonId: string,
  projectId: string | undefined = import.meta.env.VITE_FIREBASE_PROJECT_ID,
) => {
  const origin =
    projectId === "nwplus-ubc" ? "https://portal.nwplus.io" : "https://dev-nwplus-portal.web.app";
  return `${origin}/${hackathonId.replace(/\d{4}$/, "").toLowerCase()}/wrapped`;
};

export function subscribeToWrappedEmailLedger(
  hackathonId: string,
  onChange: (ledger: WrappedEmailLedger | null) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, "Hackathons", hackathonId, "wrappedEmail", "ledger"),
    (snapshot) => onChange((snapshot.data() as WrappedEmailLedger | undefined) ?? null),
    onError,
  );
}

/** One-time read; the ledger already carries live per-recipient results. */
export async function loadWrappedEmailRecipientUids(hackathonId: string) {
  const snapshot = await getDocs(recipientsQuery(hackathonId));
  return snapshot.docs.map((applicant) => applicant.id);
}

export async function countWrappedEmailRecipients(hackathonId: string) {
  const snapshot = await getCountFromServer(recipientsQuery(hackathonId));
  return snapshot.data().count;
}

export async function startWrappedEmailDelivery(hackathonId: string) {
  const start = httpsCallable<{ dbCollectionName: string }, { runId: string; started: boolean }>(
    getFunctions(),
    "startWrappedEmailDelivery",
    { timeout: 120000 },
  );
  return (await start({ dbCollectionName: hackathonId })).data;
}

export function subscribeToWrappedSettings(
  hackathonId: string,
  onChange: (settings: WrappedSettings) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, "Hackathons", hackathonId),
    (snapshot) => onChange((snapshot.data() as Hackathon | undefined)?.wrapped ?? {}),
    onError,
  );
}

/**
 * Updates only the given wrapped.* fields on Hackathons/{id}, leaving siblings untouched
 * @param changes - fields to set; url: null removes the link override
 */
export async function updateWrappedSettings(
  hackathonId: string,
  changes: { isReady?: boolean; bannerUrl?: string; url?: string | null },
) {
  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) continue;
    update[`wrapped.${key}`] = value === null ? deleteField() : value;
  }
  if (Object.keys(update).length === 0) return;
  await updateDoc(doc(db, "Hackathons", hackathonId), update);
}
