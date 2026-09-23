import { auth, db } from "@/lib/firebase/client";
import type { PreHackathonWorkshop } from "@/lib/firebase/types";
import { getHackathonType } from "@/lib/utils";
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
} from "firebase/firestore";

const PORTAL_BASE_URL = import.meta.env.VITE_QR_PORTAL_ORIGIN || "https://portal.nwplus.io";

export const subscribeToPreHackathonWorkshops = (
  hackathon: string,
  callback: (docs: PreHackathonWorkshop[]) => void,
) =>
  onSnapshot(
    query(collection(db, "Hackathons", hackathon, "PreHackathonWorkshops")),
    (querySnapshot) => {
      const workshops = [];
      for (const workshop of querySnapshot.docs) {
        workshops.push({
          ...(workshop.data() as unknown as PreHackathonWorkshop),
          _id: workshop.id,
        });
      }
      callback(workshops);
    },
  );

export const upsertPreHackathonWorkshop = async (
  hackathon: string,
  eventId: string,
  name: string,
) => {
  try {
    const record = {
      lastModified: Timestamp.now(),
      lastModifiedBy: auth.currentUser?.email ?? "",
    };

    await setDoc(
      doc(db, "Hackathons", hackathon, "PreHackathonWorkshops", eventId),
      { eventId, name, ...record },
      { merge: true },
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deletePreHackathonWorkshop = async (hackathon: string, eventId: string) => {
  if (!eventId) return;
  try {
    await deleteDoc(doc(db, "Hackathons", hackathon, "PreHackathonWorkshops", eventId));
  } catch (error) {
    console.log(error);
  }
};

export const buildPreHackathonQrUrl = (hackathonId: string, eventId: string, name: string) =>
  `${PORTAL_BASE_URL}/${getHackathonType(hackathonId)}/attendance?event=${eventId}&name=${encodeURIComponent(name)}`;
