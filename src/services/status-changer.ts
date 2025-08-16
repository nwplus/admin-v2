import { db } from "@/lib/firebase/client";
import type { ApplicationStatus } from "@/lib/firebase/types";
import { chunkArray } from "@/lib/utils";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";

export interface UpdateStatusResult {
  updatedCount: number;
  matchedEmails: string[];
  notFoundEmails: string[];
}

/**
 * Updates applicants' status.applicationStatus by matching their basicInfo.email against the provided list.
 * Firestore supports `in` queries up to 10 values, so inputs are chunked accordingly.
 */
export const updateApplicantsStatusByEmails = async (
  hackathon: string,
  emails: string[],
  applicationStatus: ApplicationStatus,
): Promise<UpdateStatusResult> => {
  const normalized = Array.from(
    new Set(
      emails
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0),
    ),
  );

  if (normalized.length === 0) {
    return { updatedCount: 0, matchedEmails: [], notFoundEmails: [] };
  }

  let updatedCount = 0;
  const matchedEmails: string[] = [];

  const chunks = chunkArray(normalized, 10);
  for (const emailChunk of chunks) {
    const q = query(
      collection(db, "Hackathons", hackathon, "Applicants"),
      where("basicInfo.email", "in", emailChunk),
      where("status.applicationStatus", "!=", "inProgress"),
    );
    const snapshot = await getDocs(q);

    const docs = snapshot.docs.map((d) => ({ id: d.id, email: String(d.data()?.basicInfo?.email || "").toLowerCase() }));

    for (const { id, email } of docs) {
      matchedEmails.push(email);
      const ref = doc(db, "Hackathons", hackathon, "Applicants", id);
      await updateDoc(ref, { "status.applicationStatus": applicationStatus });
      updatedCount += 1;
    }
  }

  const notFoundEmails = normalized.filter((e) => !matchedEmails.includes(e));

  return { updatedCount, matchedEmails, notFoundEmails };
}; 