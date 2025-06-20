// import { collection, getDocs, doc, setDoc, Timestamp } from "firebase/firestore";
// import { db } from "@/lib/firebase/client";
// import { auth } from "@/lib/firebase/client";
// import type { DiscordQuestion } from "@/lib/firebase/types";

// /**
//  * Fetches all Discord questions from the database
//  */
// export const getDiscordQuestions = async (): Promise<DiscordQuestion[]> => {
//   try {
//     const questionsSnapshot = await getDocs(collection(db, "DiscordQuestions"));
//     return questionsSnapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     })) as DiscordQuestion[];
//   } catch (error) {
//     console.error("Error fetching Discord questions:", error);
//     throw error;
//   }
// };

// /**
//  * Creates or updates a Discord question
//  */
// export const upsertDiscordQuestion = async (question: Omit<DiscordQuestion, "id" | "updatedAt" | "updatedBy">, id?: string) => {
//   try {
//     const record = {
//       updatedAt: Timestamp.now(),
//       updatedBy: auth.currentUser?.email ?? "",
//     };

//     const questionId = id || doc(collection(db, "DiscordQuestions")).id;
//     await setDoc(doc(db, "DiscordQuestions", questionId), { ...question, ...record }, { merge: true });
//     return questionId;
//   } catch (error) {
//     console.error("Error upserting Discord question:", error);
//     throw error;
//   }
// }; 

import { auth, db } from "@/lib/firebase/client";
import type { DiscordQuestion } from "@/lib/firebase/types";
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
 * Utility function that returns DiscordQuestions collection realtime data
 * @param callback - The function used to ingest the data
 * @returns a function to be called on dismount
 */

