import {
  type DocumentReference,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "./client";
import { deleteSponsorImage, uploadSponsorImage } from "./storage";
import type { Applicant, FAQ, Hackathon, HackathonSponsors, InternalWebsitesCMS } from "./types";

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
 *  depending on the presence of its _id field
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

    const faqId = id || doc(collection(db, "FAQ")).id;
    await setDoc(doc(db, "FAQ", faqId), { ...faq, ...record }, { merge: true });
  } catch (error) {
    console.error(error);
    throw error;
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

/**
 * Utility function that returns Applicants collection group realtime data
 * @param hackathon - The hackathon collection of the applicants to query
 * @param callback - The function used to ingest the data
 * @returns a listener function to be called on dismount
 */
export const subscribeToApplicants = (hackathon: string, callback: (docs: Applicant[]) => void) =>
  onSnapshot(query(collection(db, "Hackathons", hackathon, "Applicants")), (querySnapshot) => {
    const applicants = [];
    for (const doc of querySnapshot.docs) {
      applicants.push({
        ...(doc.data() as unknown as Applicant),
        _id: doc.id,
      });
    }
    callback(applicants);
  });

/**
 * Utility function that returns the admin/CMS document
 * @returns CMS document in Firestore
 */
export const getAdminFlags = async () => {
  try {
    const adminSnap = await getDoc(doc(db, "InternalWebsites", "CMS"));
    if (!adminSnap.exists()) throw new Error("CMS in InternalWebsites doesn't exist");
    return adminSnap.data() as unknown as InternalWebsitesCMS;
  } catch (error) {
    console.log(error);
  }
};

/**
 * Utility function to handle applicant updates
 * @param hackathon - of the applicant
 * @param applicantId - of the applicant
 * @param update - changes to patch
 * @returns void
 */
type Object<T = string | number | Timestamp | undefined> = {
  [key: string]: T | Object<T>;
};
export const updateApplicant = async (hackathon: string, applicantId: string, update: Object) => {
  try {
    const applicantRef = await doc(db, "Hackathons", hackathon, "Applicants", applicantId);
    await setDoc(applicantRef, update, { merge: true });
  } catch (err) {
    console.error("Error updating applicant: ", err);
  }
};
