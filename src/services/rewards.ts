import { auth, db } from "@/lib/firebase/client";
import type { HackathonRewards } from "@/lib/firebase/types";
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
 * Utility function that returns Rewards sub-collection realtime data
 * @param callback - The function used to ingest the data
 * @returns a function to be called on dismount
 */
export const subscribeToRewards = (
  hackathon: string,
  callback: (docs: HackathonRewards[]) => void,
) =>
  onSnapshot(query(collection(db, "Hackathons", hackathon, "Rewards")), (querySnapshot) => {
    const rewards = [];
    for (const doc of querySnapshot.docs) {
      rewards.push({
        ...(doc.data() as unknown as HackathonRewards),
        _id: doc.id,
      });
    }
    callback(rewards);
  });

/**
 * Utility function that updates or adds a reward document
 * @param hackathon - the hackathon of the collection
 * @param reward - the reward doc to update or insert
 * @param id - if updating, ID of the Reward doc to update
 */
export const upsertReward = async (hackathon: string, reward: HackathonRewards, id?: string) => {
  try {
    const record = {
      lastmod: Timestamp.now(),
      lastmodBy: auth.currentUser?.email ?? "",
    };

    const rewardId = id || doc(collection(db, "Hackathons", hackathon, "Rewards")).id;
    await setDoc(
      doc(db, "Hackathons", hackathon, "Rewards", rewardId),
      { ...reward, ...record },
      { merge: true },
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * Utility function to delete a Reward doc
 * @param id - the ID of the Reward document to delete
 */
export const deleteReward = async (hackathon: string, id: string) => {
  if (!id) return;
  try {
    await deleteDoc(doc(db, "Hackathons", hackathon, "Rewards", id));
  } catch (error) {
    console.log(error);
  }
};
