import { auth, db } from "@/lib/firebase/client";
import { deleteSponsorImage, uploadSponsorImage } from "@/lib/firebase/storage";
import type { HackathonSponsors } from "@/lib/firebase/types";
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
 * Utility function that returns Sponsors subcollection realtime data
 * @param callback - The function used to ingest the data
 * @returns a function to be called on dismount
 */
export const subscribeToSponsors = (
  hackathon: string,
  callback: (docs: HackathonSponsors[]) => void,
) =>
  onSnapshot(query(collection(db, "Hackathons", hackathon, "Sponsors")), (querySnapshot) => {
    const sponsors = [];
    for (const doc of querySnapshot.docs) {
      sponsors.push({
        ...(doc.data() as unknown as HackathonSponsors),
        _id: doc.id,
      });
    }
    callback(sponsors);
  });

/**
 * Utility function that updates or adds a document,
 *  depending on if an id argument is passed
 * @param hackathon - the hackathon for this sponsor
 * @param sponsor - the sponsor to update or insert
 * @param imageFile - optional image to upsert
 * @returns the upsert sponsor document ref
 */
export const upsertHackathonSponsorWithImage = async (
  hackathon: string,
  sponsor: HackathonSponsors,
  imageFile?: File | null,
  id?: string,
): Promise<DocumentReference | null> => {
  try {
    const sponsorId = id ?? doc(collection(db, "Hackathons", hackathon, "Sponsors")).id;
    const sponsorRef = doc(db, "Hackathons", hackathon, "Sponsors", sponsorId);

    const record = {
      lastmod: Timestamp.now(),
      lastmodBy: auth.currentUser?.email ?? "",
    };

    await runTransaction(db, async (txn) => {
      if (!id) txn.set(sponsorRef, {});
      txn.update(sponsorRef, { ...sponsor, ...record });

      if (imageFile) {
        const imageUrl = await uploadSponsorImage(hackathon, sponsorId, imageFile);
        txn.update(sponsorRef, {
          imgURL: imageUrl,
        });
      }
    });

    return sponsorRef;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const deleteHackathonSponsorWithImage = async (hackathon: string, sponsorId: string) => {
  try {
    await deleteSponsorImage(hackathon, sponsorId);
    await deleteDoc(doc(db, "Hackathons", hackathon, "Sponsors", sponsorId));
  } catch (error) {
    console.error("Error deleting sponsor:", error);
    throw error;
  }
};
