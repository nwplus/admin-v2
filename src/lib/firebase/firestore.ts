import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "./client";
import type { Hackathon } from "./types";

/**
 * Utility function that returns Hackathons collection realtime data
 * @param callback - The function used to ingest the data
 * @returns a listener function to be called on dismount
 */
export const subscribeToHackathons = (callback: (docs: Hackathon[]) => void) =>
  onSnapshot(query(collection(db, "Hackathons")), (querySnapshot) => {
    const hackathons = [];
    for (const doc of querySnapshot.docs) {
      hackathons.push({
        ...(doc.data() as unknown as Hackathon),
        _id: doc.id,
      });
    }
    callback(hackathons);
  });
