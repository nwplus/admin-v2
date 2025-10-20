import { db } from "@/lib/firebase/client";
import type { Applicant, ApplicantContribution, InternalWebsitesCMS } from "@/lib/firebase/types";
import {
  type Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import * as math from "mathjs";

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
 * Utility function that returns Applicants collection group realtime data
 * @param hackathon - The hackathon collection of the applicants to query
 * @param callback - The function used to ingest the data
 * @returns a listener function to be called on dismount
 */
export const subscribeToApplicants = (hackathon: string, callback: (docs: Applicant[]) => void) =>
  onSnapshot(
    query(
      collection(db, "Hackathons", hackathon, "Applicants"),
      where("status.applicationStatus", "!=", "inProgress"),
    ),
    (querySnapshot) => {
      const applicants = [];
      for (const doc of querySnapshot.docs) {
        applicants.push({
          ...(doc.data() as unknown as Applicant),
          _id: doc.id,
        });
      }
      callback(applicants);
    },
  );

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

/**
 * Utility function that returns graded applicants
 * @param hackathon - The hackathon collection of the applicants to query
 * @param callback - The function used to ingest the data
 * @returns a listener function to be called on dismount
 */
export const getGradedApplicants = (hackathon: string, callback: (docs: Applicant[]) => void) =>
  onSnapshot(
    query(
      collection(db, "Hackathons", hackathon, "Applicants"),
      where("status.applicationStatus", "==", "scored"),
    ),
    (querySnapshot) => {
      const applicants = [];
      for (const doc of querySnapshot.docs) {
        applicants.push({
          ...(doc.data() as unknown as Applicant),
          _id: doc.id,
        });
      }
      callback(applicants);
    },
  );

// this is what the data looks like in firebase
// {
// 	[applicantId: string]: {
// 		score: {
// 			// ... other stuff
// 				scores: {
// 					[questionName: string]: {
// 						lastUpdated: Date
// 						lastUpdatedBy: string
// 						score: number
// 					}
// 				}
// 			}
// 		}
// 	}
// }

// this is what the data looks like after transformation
// {
// 	"Jason": {
// 		"Q1": [[score, appId], [score2, appId2]]
// 	}
// }

type Grader = string; // email
type Question = string; // e.g. "ResponseOneScore"
type ScoreApplicantTuple = [number, string]; // [ score, applicant ID ]
type Grades = Record<Question, ScoreApplicantTuple[]>;
type NormalizedScore = Record<string, Record<string, ScoreApplicantTuple[]>>;

export const transformScores = (hackathon: string) => {
  const result: Record<Grader, Grades> = {};

  return new Promise((resolve) => {
    getGradedApplicants(hackathon, (applicants: Applicant[]) => {
      if (!applicants) {
        resolve({});
        return;
      }

      for (const applicant of applicants) {
        if (!applicant?._id || !applicant?.score?.scores) return;
        const {
          _id,
          score: { scores },
        } = applicant;
        for (const [questionName, value] of Object.entries(scores)) {
          if (!value?.lastUpdatedBy || typeof value?.score !== "number") continue;
          const { lastUpdatedBy, score } = value;
          if (!result[lastUpdatedBy]) {
            result[lastUpdatedBy] = {};
          }
          if (!result[lastUpdatedBy][questionName]) {
            result[lastUpdatedBy][questionName] = [];
          }
          result[lastUpdatedBy][questionName].push([score, _id]);
        }
      }
      resolve(result);
    });
  });
};

export const updateNormalizedScores = async (
  hackathon: string,
  normalizedScores: NormalizedScore,
) => {
  const applicantScores: Record<string, Record<string, number>> = {};

  // Reorganize data by applicant ID
  for (const [, questions] of Object.entries(normalizedScores)) {
    for (const [questionName, scores] of Object.entries(questions)) {
      for (const [normalizedScore, applicantId] of scores) {
        if (!applicantScores[applicantId]) {
          applicantScores[applicantId] = {};
        }
        if (!applicantScores[applicantId][questionName]) {
          applicantScores[applicantId][questionName] = normalizedScore;
        }
      }
    }
  }

  const promises = Object.entries(applicantScores).map(([applicantId, questions]) => {
    const updates: Record<string, number> = {};
    for (const [questionName, normalizedScore] of Object.entries(questions)) {
      updates[`score.scores.${questionName}.normalizedScore`] = normalizedScore;
    }

    const total = Object.values(questions).reduce((sum, z) => sum + (typeof z === "number" ? z : 0), 0);
    updates["score.totalZScore"] = Math.round(total * 100) / 100;

    const applicantRef = doc(db, "Hackathons", hackathon, "Applicants", applicantId);
    return updateDoc(applicantRef, updates);
  });

  try {
    await Promise.all(promises);
    console.log("Successfully updated normalized scores in Firebase");
  } catch (error) {
    console.error("Error updating normalized scores:", error);
    throw error;
  }
};

export const calculateNormalizedScores = async (hackathon: string) => {
  const data = (await transformScores(hackathon)) as unknown as Record<Grader, Grades>;
  const normalizedScores: NormalizedScore = {};

  for (const grader of Object.keys(data)) {
    normalizedScores[grader] = {};
    for (const [questionName, questions] of Object.entries(data[grader])) {
      const scores = questions.map(([score]) => score);
      const mean = math.mean(scores) as unknown as number;
      const stdDev = math.std(scores) as unknown as number;
      normalizedScores[grader][questionName] = data[grader][questionName].map(([score, appId]) => [
        stdDev === 0 ? 0 : (score - mean) / stdDev,
        appId,
      ]);
    }
  }

  await updateNormalizedScores(hackathon, normalizedScores);
};

export const getApplicantsToAccept = async (
  hackathon: string,
  minScore?: number,
  minZScore?: number,
  minPrevHacks?: number,
  maxPrevHacks?: number,
  yearLevels?: string[],
  contributionRoles?: string[],
  minExperiencesScore?: number,
  maxExperiencesScore?: number,
) => {
  const querySnapshot = await getDocs(query(collection(db, "Hackathons", hackathon, "Applicants")));

  const applicants: Applicant[] = [];
  for (const doc of querySnapshot.docs) {
    applicants.push({
      ...(doc.data() as unknown as Applicant),
      _id: doc.id,
    });
  }

  if (applicants?.length === 0) return [];

  return applicants.filter((applicant: Applicant) => {
    if (!applicant?.status) return false;
    const appStatus = applicant.status.applicationStatus;
    if (appStatus !== "scored") return false;

    // score
    const totalScore = applicant?.score?.totalScore;
    if (totalScore === undefined || totalScore === null || Number.isNaN(totalScore)) return false;
    if (minScore !== undefined && totalScore < minScore) return false;

    // zscore
    const totalZScore = applicant?.score?.totalZScore;
    if (totalZScore === undefined || totalZScore === null || Number.isNaN(totalZScore)) return false;
    if (minZScore !== undefined && totalZScore < minZScore) return false;

    // range of hackathons attended
    if (!applicant?.skills) return;
    const numHackathonsAttended = applicant.skills?.numHackathonsAttended;
    if (
      (minPrevHacks !== undefined && Number(numHackathonsAttended) < Number(minPrevHacks)) ||
      (maxPrevHacks !== undefined && Number(numHackathonsAttended) > Number(maxPrevHacks))
    ) {
      return false;
    }

    // range for year level
    if (!applicant.basicInfo) return false;
    const yearLevel = applicant.basicInfo?.educationLevel;
    if (yearLevels && yearLevels.length > 0 && !yearLevels.includes(yearLevel)) {
      return false;
    }

    // for intended role
    if (contributionRoles && contributionRoles.length > 0) {
      const contributionRoleMap =
        applicant.skills?.contributionRole ?? ({} as ApplicantContribution);
      const hasValidRole = contributionRoles.some(
        (role) => contributionRoleMap[role as keyof typeof contributionRoleMap],
      );
      if (!hasValidRole) return false;
    }

    // range for # of experiences
    const numExperiences = applicant.score?.scores?.NumExperiences.score;
    if (
      (minExperiencesScore !== undefined && Number(numExperiences) < Number(minExperiencesScore)) ||
      (maxExperiencesScore !== undefined && Number(numExperiences) > Number(maxExperiencesScore))
    ) {
      return false;
    }

    return true;
  });
};

export const acceptApplicants = async (hackathon: string, acceptIds: string[]) => {
  const promises = acceptIds.map((applicantId) => {
    const applicantRef = doc(db, "Hackathons", hackathon, "Applicants", applicantId);
    return updateDoc(applicantRef, {
      "status.applicationStatus": "acceptedNoResponseYet",
    });
  });

  try {
    await Promise.all(promises);
    return { success: true, count: acceptIds.length };
  } catch (error) {
    console.error("Error accepting applicants:", error);
    throw error;
  }
};

/**
 * Subscribe to long-answer questions in real-time
 * @param hackathon - The hackathon collection of the applicants to query
 * @param onUpdate - Callback with array of { formInput, description }
 * @returns unsubscribe function
 */
export const subscribeLongAnswerQuestions = (
  hackathon: string,
  onUpdate: (questions: { formInput: string; description: string }[]) => void,
) => {
  const trimmedHackathon = hackathon.slice(0, -4);
  const q = query(
    collection(db, "HackerAppQuestions", trimmedHackathon, "Skills"),
    where("formInput", ">=", "longAnswers"),
    where("formInput", "<", "longAnswers\uf8ff"),
  );

  return onSnapshot(q, (snapshot) => {
    const questions = snapshot.docs.map((doc) => ({
      formInput: doc.data().formInput,
      description: doc.data().title,
    }));
    onUpdate(questions);
  });
};
