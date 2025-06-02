import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "./client";
import type { FAQ, Hackathon } from "./types";

/**
 * Utility function that returns FAQ collection realtime data
 * @param callback - The function used to ingest the data
 * @returns a function to be called on dismount
 */
export const subscribeToFAQ = (callback: (docs: FAQ[]) => void) =>
  onSnapshot(query(collection(db, "FAQ")), (querySnapshot) => {
    const questions = [];
    for (const doc of querySnapshot.docs) {
      questions.push({
        ...(doc.data() as unknown as FAQ),
        _id: doc.id,
      });
    }
    callback(questions);
  });

/**
 * Utility function that updates or adds a document,
 *  depending on the presence of its _id field
 * @param faq - the FAQ to update or insert
 */
export const upsertFAQ = async (faq: FAQ, id?: string) => {
  try {
    const record = {
      lastModified: Timestamp.now(),
      lastModifiedBy: auth.currentUser?.email ?? "",
    };

    if (id) {
      await setDoc(
        doc(db, "FAQ", id),
        {
          ...faq,
          ...record,
        },
        { merge: true },
      );
    } else {
      await addDoc(collection(db, "FAQ"), {
        ...faq,
        ...record,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

/**
 * Utility function to delete an FAQ item
 * @param id - the ID of the FAQ document to delete
 * @returns void
 */
export const deleteFAQ = async (id: string) => {
  if (!id) return;
  try {
    await deleteDoc(doc(db, "FAQ", id));
  } catch (error) {
    console.log(error);
  }
};

/**
 * Utility function that returns Hackathons collection relatime data
 * @param callback - The function used to ingest the data
 * @returns a function to be called on dismount
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
