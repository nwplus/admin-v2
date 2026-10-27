import { db } from "@/lib/firebase/client";
import type { WalletEmailDelivery } from "@/lib/firebase/types";
import { doc, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

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

export async function startWalletEmailDelivery(hackathonId: string) {
  const start = httpsCallable<{ dbCollectionName: string }, { runId: string; started: boolean }>(
    getFunctions(),
    "startWalletEmailDelivery",
    { timeout: 120000 },
  );
  return (await start({ dbCollectionName: hackathonId })).data;
}
