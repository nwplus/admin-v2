import { auth, db } from "@/lib/firebase/client";
import {
  deleteStampImage,
  deleteStampQR as deleteStampQRFromStorage,
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
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
} from "firebase/firestore";

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
 * @param stamp - the stamp to update or insert
 * @param imageFile - optional image to upsert
 * @param qrBlob - optional QR blob to upload
 * @param id - optional existing stamp ID for updates
 * @returns the upsert stamp document ref
 */
export const upsertStampWithImage = async (
  stamp: Stamp,
  imageFile?: File | null,
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

