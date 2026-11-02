import { db } from "@/lib/firebase/client";
import type { WalletEmailDelivery, WalletEmailSend } from "@/lib/firebase/types";
import {
  collection,
  doc,
  getCountFromServer,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const recipientsQuery = (hackathonId: string) =>
  query(
    collection(db, "Hackathons", hackathonId, "Applicants"),
    where("status.applicationStatus", "==", "acceptedAndAttending"),
  );

export function subscribeToWalletEmailSends(
  hackathonId: string,
  onChange: (sends: WalletEmailSend[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, "Hackathons", hackathonId, "emailSends"),
    (snapshot) =>
      onChange(
        snapshot.docs.map(
          (send) =>
            ({
              uid: send.id,
              ...send.data(),
            }) as WalletEmailSend,
        ),
      ),
    onError,
  );
}

export function subscribeToWalletEmailRecipients(
  hackathonId: string,
  onChange: (uids: string[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    recipientsQuery(hackathonId),
    (snapshot) => onChange(snapshot.docs.map((applicant) => applicant.id)),
    onError,
  );
}

export function subscribeToWalletEmailDelivery(
  hackathonId: string,
  onChange: (state: WalletEmailDelivery | null) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, "Hackathons", hackathonId),
    (snapshot) =>
      onChange((snapshot.data()?.walletEmail as WalletEmailDelivery | undefined) ?? null),
    onError,
  );
}

export interface WalletEmailRecipient {
  uid: string;
  email?: string;
}

export async function getWalletEmailRecipients(
  hackathonId: string,
): Promise<WalletEmailRecipient[]> {
  const snapshot = await getDocs(recipientsQuery(hackathonId));
  return snapshot.docs.map((applicant) => {
    const email = applicant.data().basicInfo?.email;
    return {
      uid: applicant.id,
      email: typeof email === "string" ? email : undefined,
    };
  });
}

export async function countWalletEmailRecipients(hackathonId: string) {
  const snapshot = await getCountFromServer(recipientsQuery(hackathonId));
  return snapshot.data().count;
}

export async function startWalletEmailDelivery(hackathonId: string) {
  const start = httpsCallable<{ dbCollectionName: string }, { runId: string; started: boolean }>(
    getFunctions(),
    "startWalletEmailDelivery",
    { timeout: 120000 },
  );
  return (await start({ dbCollectionName: hackathonId })).data;
}
