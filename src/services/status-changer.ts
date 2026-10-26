import { db } from "@/lib/firebase/client";
import type { ApplicationStatus } from "@/lib/firebase/types";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";

export interface UpdateStatusResult {
  updatedCount: number;
  matchedEmails: string[];
  notFoundEmails: string[];
}

/**
 * Updates submitted applicants using a case-insensitive email match.
 * Legacy emails retain their original casing, so Firestore's case-sensitive queries
 * cannot find every match. Read only the selected event and normalize both sides.
 */
export const updateApplicantsStatusByEmails = async (
  hackathon: string,
  emails: string[],
  applicationStatus: ApplicationStatus,
): Promise<UpdateStatusResult> => {
  const normalized = Array.from(
    new Set(emails.map((e) => e.trim().toLowerCase()).filter((e) => e.length > 0)),
  );

  if (normalized.length === 0) {
    return { updatedCount: 0, matchedEmails: [], notFoundEmails: [] };
  }

  let updatedCount = 0;
  const matchedEmails = new Set<string>();
  const requestedEmails = new Set(normalized);
  const snapshot = await getDocs(collection(db, "Hackathons", hackathon, "Applicants"));

  for (const applicant of snapshot.docs) {
    const data = applicant.data();
    const currentStatus = data.status?.applicationStatus;
    if (!currentStatus || currentStatus === "inProgress" || data.submission?.submitted === false) {
      continue;
    }

    const storedEmail = data.basicInfo?.email;
    if (typeof storedEmail !== "string") continue;
    const email = storedEmail.trim().toLowerCase();
    if (!requestedEmails.has(email)) continue;

    const ref = doc(db, "Hackathons", hackathon, "Applicants", applicant.id);
    await updateDoc(ref, { "status.applicationStatus": applicationStatus });
    matchedEmails.add(email);
    updatedCount += 1;
  }

  const notFoundEmails = normalized.filter((email) => !matchedEmails.has(email));

  return { updatedCount, matchedEmails: Array.from(matchedEmails), notFoundEmails };
};
