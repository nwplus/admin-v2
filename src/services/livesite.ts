import { auth, db } from "@/lib/firebase/client";
import type { LivesiteSettings } from "@/lib/firebase/types";
import {
  Timestamp,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

/**
 * Returns livesite settings from InternalWebsites/Livesite
 * @param callback - The function used to ingest the data
 * @returns a listener function to be called on dismount
 */
export const subscribeToLivesiteSettings = (callback: (data: LivesiteSettings | null) => void) =>
  onSnapshot(doc(db, "InternalWebsites", "Livesite"), (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data() as LivesiteSettings;
      callback({
        ...data,
        _id: docSnapshot.id,
      });
    } else {
      callback(null);
    }
  });

/**
 * Updates livesite settings
 * @param settings - the livesite settings to update
 */
export const updateLivesiteSettings = async (settings: Partial<LivesiteSettings>) => {
  try {
    const record = {
      lastEdited: Timestamp.now(),
      lastEditedBy: auth.currentUser?.email ?? "",
    };

    await setDoc(doc(db, "InternalWebsites", "Livesite"), { ...settings, ...record }, { merge: true });
  } catch (error) {
    console.error(error);
    throw error;
  }
};
