import { auth, db } from "@/lib/firebase/client";
import { deleteSponsorImage, uploadSponsorImage } from "@/lib/firebase/storage";
import type { HackathonSponsorTiers, HackathonSponsors } from "@/lib/firebase/types";
import {
  type DocumentReference,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  writeBatch,
} from "firebase/firestore";

const TIER_RANK: Record<HackathonSponsorTiers, number> = {
  title: 0,
  platinum: 1,
  gold: 2,
  silver: 3,
  bronze: 4,
  startup: 5,
  inkind: 6,
};
const UNRANKED = Number.MAX_SAFE_INTEGER;

/**
 * Canonical sponsor ordering: manual `order` first, then tier.
 * Sponsors without an `order` come after the ones that have it.
 */
export const compareSponsors = (a: HackathonSponsors, b: HackathonSponsors) =>
  (a.order ?? UNRANKED) - (b.order ?? UNRANKED) ||
  (TIER_RANK[a.tier as HackathonSponsorTiers] ?? UNRANKED) -
    (TIER_RANK[b.tier as HackathonSponsorTiers] ?? UNRANKED);

/**
 * Utility function that returns Sponsors subcollection realtime data, in canonical order
 * @param callback - The function used to ingest the data
 * @returns a function to be called on dismount
 */
export const subscribeToSponsors = (
  hackathon: string,
  callback: (docs: HackathonSponsors[]) => void,
) =>
  onSnapshot(query(collection(db, "Hackathons", hackathon, "Sponsors")), (querySnapshot) => {
    const sponsors = querySnapshot.docs.map((doc) => ({
      ...(doc.data() as unknown as HackathonSponsors),
      _id: doc.id,
    }));
    callback(sponsors.sort(compareSponsors));
  });

/**
 * Utility function that persists a manual sponsor ordering,
 *  only writing the sponsors whose position changed
 * @param hackathon - the hackathon for these sponsors
 * @param sponsors - the sponsors, in their new order
 */
export const updateHackathonSponsorsOrder = async (
  hackathon: string,
  sponsors: HackathonSponsors[],
) => {
  const batch = writeBatch(db);
  sponsors.forEach((sponsor, index) => {
    if (!sponsor._id || sponsor.order === index) return;
    batch.update(doc(db, "Hackathons", hackathon, "Sponsors", sponsor._id), { order: index });
  });
  await batch.commit();
};

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
