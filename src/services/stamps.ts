import { auth, db } from "@/lib/firebase/client";
import {
  deleteLockedStampImage,
  deleteStampImage,
  deleteStampQR as deleteStampQRFromStorage,
  uploadLockedStampImage,
  uploadStampImage,
  uploadStampQR,
} from "@/lib/firebase/storage";
import type { Stamp } from "@/lib/firebase/types";
import {
  type DocumentReference,
  Timestamp,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
} from "firebase/firestore";

/**
 * Represents a user's collected stamp entry; used for exports.
 */
export interface HackerStampEntry {
  displayName: string;
  email: string;
  stampId: string;
}

/**
 * Utility function that returns Stamps collection realtime data
 * @param callback - The function used to ingest the data
 * @returns a function to be called on dismount
 */
export const subscribeToStamps = (callback: (docs: Stamp[]) => void) =>
  onSnapshot(query(collection(db, "Stamps")), (querySnapshot) => {
    const stamps: Stamp[] = [];
    for (const doc of querySnapshot.docs) {
      stamps.push({
        ...(doc.data() as Stamp),
        _id: doc.id,
      });
    }
    callback(stamps);
  });

/**
 * Utility function that updates or adds a stamp document, depending on if an id argument is passed
 * @param stamp - the stamp to upsert
 * @param imageFile - optional stamp image
 * @param lockedImageFile - optional image for stamp in locked state
 * @param qrBlob - optional QR blob to upload
 * @param id - optional existing stamp ID for updates
 * @returns the upsert stamp document ref
 */
export const upsertStampWithImage = async (
  stamp: Stamp,
  imageFile?: File | null,
  lockedImageFile?: File | null,
  qrBlob?: Blob | null,
  id?: string,
): Promise<DocumentReference | null> => {
  try {
    const stampId = id ?? doc(collection(db, "Stamps")).id;
    const stampRef = doc(db, "Stamps", stampId);

    const record = {
      lastModified: Timestamp.now(),
      lastModifiedBy: auth.currentUser?.email ?? "",
    };

    await runTransaction(db, async (transaction) => {
      if (!id) transaction.set(stampRef, {});
      transaction.update(stampRef, { ...stamp, ...record });

      if (imageFile) {
        const imageUrl = await uploadStampImage(stampId, imageFile);
        transaction.update(stampRef, {
          imgURL: imageUrl,
        });
      }

      if (lockedImageFile) {
        const lockedImageUrl = await uploadLockedStampImage(stampId, lockedImageFile);
        transaction.update(stampRef, {
          lockedImgURL: lockedImageUrl,
        });
      }

      if (qrBlob) {
        const qrUrl = await uploadStampQR(stampId, qrBlob);
        transaction.update(stampRef, {
          qrURL: qrUrl,
        });
      }
    });

    return stampRef;
  } catch (error) {
    console.error("Error upserting stamp:", error);
    return null;
  }
};

/**
 * Delete a stamp and its associated images
 * @param stampId - the ID of the stamp to delete
 */
export const deleteStampWithImage = async (stampId: string) => {
  try {
    await deleteStampImage(stampId);
    await deleteLockedStampImage(stampId);
    await deleteStampQRFromStorage(stampId);
    await deleteDoc(doc(db, "Stamps", stampId));
  } catch (error) {
    console.error("Error deleting stamp:", error);
    throw error;
  }
};

/**
 * Delete a stamp's QR code from storage and remove the qrURL field from Firestore
 * @param stampId - the ID of the stamp whose QR should be deleted
 */
export const deleteStampQR = async (stampId: string) => {
  try {
    await deleteStampQRFromStorage(stampId);
    const stampRef = doc(db, "Stamps", stampId);
    await updateDoc(stampRef, {
      qrURL: deleteField(),
    });
  } catch (error) {
    console.error("Error deleting stamp QR:", error);
    throw error;
  }
};

/**
 * Fetches all hackers with unlocked stamps from the Socials collection.
 * Each stamp a user has unlocked creates one entry (for nwHacks 2026 raffle weighting).
 * @returns Array of entries where each entry represents one stamp collected by a hacker
 */
export const fetchHackersWithStamps = async (): Promise<HackerStampEntry[]> => {
  const socialsSnapshot = await getDocs(collection(db, "Socials"));
  const entries: HackerStampEntry[] = [];

  for (const socialDoc of socialsSnapshot.docs) {
    const socialData = socialDoc.data();
    const displayName = socialData.preferredName || "User";
    const email = socialData.email || "";
    const unlockedStamps: string[] = socialData.unlockedStamps || [];

    for (const stampId of unlockedStamps) {
      entries.push({
        displayName,
        email,
        stampId: typeof stampId === "string" ? stampId : String(stampId),
      });
    }
  }

  return entries;
};
