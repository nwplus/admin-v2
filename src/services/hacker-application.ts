import { auth, db } from "@/lib/firebase/client";
import type {
  HackerApplicationMetadata,
  HackerApplicationQuestion,
  HackerApplicationSections,
} from "@/lib/firebase/types";
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  writeBatch,
} from "firebase/firestore";

/**
 * Utility function that returns HackerAppQuestions doc data
 * @param hackathonName - the hackathon to query
 * @param callback - The function used to ingest the data
 * @returns a function to be called on dismount
 */
export const subscribeToHackerAppDoc = (
  hackathonName: string,
  callback: (doc: HackerApplicationMetadata) => void,
) =>
  onSnapshot(doc(db, "HackerAppQuestions", hackathonName), (queryDoc) => {
    if (!queryDoc.exists) {
      return null;
    }
    callback(queryDoc.data() as unknown as HackerApplicationMetadata);
  });

/**
 * Utility function that returns all questions for each section
 * @param hackathonName - the hackathon to query
 * @param callback - the function to ingest the data
 * @returns a function to be called on dismount
 */
export const subscribeToHackerAppQuestions = (
  hackathonName: string,
  callback: (data: Record<HackerApplicationSections, HackerApplicationQuestion[]>) => void,
) => {
  const sections = ["BasicInfo", "Questionnaire", "Skills", "Welcome"] as const;
  const data: Record<HackerApplicationSections, HackerApplicationQuestion[]> = {
    BasicInfo: [],
    Questionnaire: [],
    Skills: [],
    Welcome: [],
  };
  const unsubscribers: (() => void)[] = [];
  const loadedSections = new Set<string>();

  for (const section of sections) {
    const unsubscribe = onSnapshot(
      query(collection(db, "HackerAppQuestions", hackathonName, section)),
      (snapshot) => {
        data[section] = snapshot.docs.map((doc) => ({
          _id: doc.id,
          ...doc.data(),
        }));
        loadedSections.add(section);
        if (loadedSections.size === sections.length) {
          callback(data);
        }
      },
    );
    unsubscribers.push(unsubscribe);
  }

  return () => {
    for (const unsubscriber of unsubscribers) {
      unsubscriber();
    }
  };
};

/**
 * Utility function that updates all the questions in a hacker app section
 * @param hackathonName - document under HackerAppQuestions
 * @param section - which section the question belongs to
 * @param questions - an array of questions to insert
 */
export const updateHackerAppSectionQuestions = async (
  hackathonName: string,
  section: HackerApplicationSections,
  questions: HackerApplicationQuestion[],
) => {
  if (questions?.length > 999) return;
  const batch = writeBatch(db);

  const existingDocs = await getDocs(collection(db, "HackerAppQuestions", hackathonName, section));
  for (const existingSnapshot of existingDocs.docs) {
    batch.delete(existingSnapshot.ref);
  }
  questions.forEach((question, index) => {
    const newDocRef = doc(
      db,
      "HackerAppQuestions",
      hackathonName,
      section,
      index.toString().padStart(3, "0"),
    );
    batch.set(newDocRef, question);
  });
  await batch.commit();

  // todo; stick with a single naming convention
  const record = {
    lastEditedAt: Timestamp.now(),
    lastEditedBy: auth.currentUser?.email ?? "",
  };

  const sectionRef = doc(db, "HackerAppQuestions", hackathonName);
  await setDoc(sectionRef, { [section]: record }, { merge: true });
};
