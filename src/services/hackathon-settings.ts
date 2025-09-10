import { auth, db } from "@/lib/firebase/client";
import type { HackathonConfig } from "@/lib/firebase/types";
import {
  Timestamp,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

/**
 * Returns hackathon config settings from InternalWebsites/Portal
 * @param callback - The function used to ingest the data
 * @returns a listener function to be called on dismount
 */
export const subscribeToHackathonConfig = (callback: (data: HackathonConfig | null) => void) =>
  onSnapshot(doc(db, "InternalWebsites", "Portal"), (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data() as HackathonConfig;
      callback({
        ...data,
        _id: docSnapshot.id,
      });
    } else {
      callback(null);
    }
  });

/**
 * Updates settings for a hackathon in InternalWebsites/Portal
 * @param config - the hackathon config to update
 */
export const updateHackathonConfig = async (config: Partial<HackathonConfig>) => {
  try {
    const record = {
      lastEdited: Timestamp.now(),
      lastEditedBy: auth.currentUser?.email ?? "",
    };

    await setDoc(doc(db, "InternalWebsites", "Portal"), { ...config, ...record }, { merge: true });
  } catch (error) {
    console.error(error);
    throw error;
  }
};