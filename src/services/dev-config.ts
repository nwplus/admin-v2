import { auth, db } from "@/lib/firebase/client";
import type { DevConfig } from "@/lib/firebase/types";
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
} from "firebase/firestore";

/**
 * Utility function that returns DevConfig collection realtime data
 * @param callback - The function used to ingest the data
 * @returns a function to be called on dismount
 */

export const subscribeToDevConfig = (callback: (docs: DevConfig[]) => void) => {
    return onSnapshot(query(collection(db, "ExternalProjects", "Factotum", "InitBotInfo")), (querySnapshot) => {
        const devConfig = [];
        for (const doc of querySnapshot.docs) {
            devConfig.push({
                ...(doc.data() as unknown as DevConfig),
                _id: doc.id,
            });
        }
        callback(devConfig);
    });
};

// export const upsertDevConfig = async (devConfig: DevConfig, id?: string) => {
    
// }