import { db } from "@/lib/firebase/client";
import type { GeneralConfig, TicketsConfig, VerificationConfig } from "@/lib/firebase/types";
import { type DocumentReference, addDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { collection, getDocs } from "firebase/firestore";

// Returns a list of guild names
export const getGuilds = async () => {
  const querySnapshot = await getDocs(collection(db, "ExternalProjects", "Factotum", "guilds"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    hackathonName: doc.data().hackathonName as string,
  }));
};

const genDocRef = (server: string) => doc(db, "ExternalProjects", "Factotum", "guilds", server);
const otherDocRef = (server: string, type: "tickets" | "verification") =>
  doc(db, "ExternalProjects", "Factotum", "guilds", server, "command-data", type);

//Subscribes to different document listeners
export const subscribeToGeneralConfig = (
  callback: (docs: GeneralConfig) => void,
  server: string,
) => {
  return onSnapshot(genDocRef(server), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback(data);
    } else {
      console.warn("No Document found");
    }
  });
};
export const subscribeToTicketsConfig = (
  callback: (docs: TicketsConfig) => void,
  server: string,
) => {
  return onSnapshot(otherDocRef(server, "tickets"), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback(data);
    } else {
      console.warn("No Document found");
    }
  });
};
export const subscribeToVerificationConfig = (
  callback: (docs: VerificationConfig) => void,
  server: string,
) => {
  return onSnapshot(otherDocRef(server, "verification"), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback(data);
    } else {
      console.warn("No Document found");
    }
  });
};

//Functions to update specific fields
async function updateConfig(ref: DocumentReference, path: string, value: string | boolean) {
  try {
    await updateDoc(ref, { [path]: value });
  } catch (error) {
    console.error(error);
  }
}
export const updateGeneralConfig = async (
  server: string,
  path: string,
  value: string | boolean,
) => {
  updateConfig(genDocRef(server), path, value);
};
export const updateTicketsConfig = async (
  server: string,
  path: string,
  value: string | boolean,
) => {
  updateConfig(otherDocRef(server, "tickets"), path, value);
};
export const updateVerificationConfig = async (
  server: string,
  path: string,
  value: string | boolean,
) => {
  updateConfig(otherDocRef(server, "verification"), path, value);
};

//Function to add participants
export const addParticipants = async (emails: string[], roles: string[], server: string) => {
  await Promise.all(
    emails.map((email) =>
      addDoc(
        collection(
          db,
          "ExternalProjects",
          "Factotum",
          "guilds",
          server,
          "command-data",
          "verification",
          "other-attendees",
        ),
        { email, roles },
      ),
    ),
  );
};
