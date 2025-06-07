import { auth, db } from "@/lib/firebase/client";
import type { HackathonDayOf } from "@/lib/firebase/types";
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
 * Utility function that returns DayOf subcollection realtime data
 * @param callback - The function used to ingest the data
 * @returns a function to be called on dismount
 */
export const subscribeToDayOf = (hackathon: string, callback: (docs: HackathonDayOf[]) => void) =>
  onSnapshot(query(collection(db, "Hackathons", hackathon, "DayOf")), (querySnapshot) => {
    const events = [];
    for (const doc of querySnapshot.docs) {
      events.push({
        ...(doc.data() as unknown as HackathonDayOf),
        _id: doc.id,
      });
    }
    callback(events);
  });

/**
 * Utility function that updates or adds a document,
 *  depending on the presence of its _id field
 * @param faq - the FAQ to update or insert
 */
export const upsertEvent = async (hackathon: string, event: HackathonDayOf, id?: string) => {
  try {
    const record = {
      lastModified: Timestamp.now(),
      lastModifiedBy: auth.currentUser?.email ?? "",
    };

    const eventId = id || doc(collection(db, "Hackathons", hackathon, "DayOf")).id;
    await setDoc(
      doc(db, "Hackathons", hackathon, "DayOf", eventId),
      { ...event, ...{ key: eventId, eventID: eventId }, ...record },
      { merge: true },
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * Utility function to delete an DayOf event item
 * @param id - the ID of the DayOf event document to delete
 * @returns void
 */
export const deleteEvent = async (hackathon: string, id: string) => {
  if (!id) return;
  try {
    await deleteDoc(doc(db, "Hackathons", hackathon, "DayOf", id));
  } catch (error) {
    console.log(error);
  }
};
