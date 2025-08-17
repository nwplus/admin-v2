import { auth, db } from "@/lib/firebase/client";
import { deleteRewardImage, uploadRewardImage } from "@/lib/firebase/storage";
import type { HackathonRewards } from "@/lib/firebase/types";
import {
  type DocumentReference,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
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
 * Utility function that updates or adds a reward document with image upload
 * @param hackathon - the hackathon of the collection
 * @param reward - the reward doc to update or insert
 * @param imageFile - optional image to upsert
 * @param id - if updating, ID of the Reward doc to update
 * @returns the upsert reward document ref
 */
export const upsertReward = async (
  hackathon: string,
  reward: HackathonRewards,
  imageFile?: File | null,
  id?: string,
): Promise<DocumentReference | null> => {
  try {
    const rewardId = id ?? doc(collection(db, "Hackathons", hackathon, "Rewards")).id;
    const rewardRef = doc(db, "Hackathons", hackathon, "Rewards", rewardId);

    const record = {
      lastmod: Timestamp.now(),
      lastmodBy: auth.currentUser?.email ?? "",
    };

    await runTransaction(db, async (txn) => {
      if (!id) txn.set(rewardRef, {});
      txn.update(rewardRef, { 
        ...reward, 
        ...record,
        key: rewardId
      });

      if (imageFile) {
        const imageUrl = await uploadRewardImage(hackathon, rewardId, imageFile);
        txn.update(rewardRef, {
          imgURL: imageUrl,
        });
      }
    });

    return rewardRef;
  } catch (error) {
    console.error(error);
    return null;
  }
};

/**
 * Utility function to delete a Reward doc with its image
 * @param hackathon - the hackathon of the collection
 * @param id - the ID of the Reward document to delete
 */
export const deleteReward = async (hackathon: string, id: string) => {
  if (!id) return;
  try {
    await deleteRewardImage(hackathon, id);
    await deleteDoc(doc(db, "Hackathons", hackathon, "Rewards", id));
  } catch (error) {
    console.error("Error deleting reward:", error);
    throw error;
  }
};
