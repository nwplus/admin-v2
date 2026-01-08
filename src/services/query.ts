import { db } from "@/lib/firebase/client";
import type { Applicant, HackathonDayOf } from "@/lib/firebase/types";
import { createStringFromSelection, returnTrueKey, splitHackathon } from "@/lib/utils";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";

/**
 * Utility function that returns Applicants collection realtime data for a specific hackathon
 * Does not include in progress applications
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
      const docs = querySnapshot.docs.map((doc) => ({ _id: doc.id, ...doc.data() }) as Applicant);
      callback(docs);
    },
  );

/**
 * Utility function to flatten applicant data for table display
 * @param applicant - The applicant object to flatten
 * @param hackathon - The hackathon name to determine data format
 * @returns a flattened object with all properties at the top level
 */
export const flattenApplicantData = (
  applicant: Applicant,
  hackathon?: string,
): FlattenedApplicant => {
  const [, year] = hackathon ? splitHackathon(hackathon) : [undefined, undefined];
  const hackathonYear = year ? Number.parseInt(year) : 2025;
  const isLegacyFormat = hackathonYear < 2024 || hackathon === "nwHacks2024";

  const computedIsOfLegalAge = (applicant: Applicant) => {
    const rawAge = applicant.basicInfo?.ageByHackathon;
    if (rawAge == "<=16") return false;
    if (rawAge == ">24") return true;

    const numericAge = typeof rawAge === "number" ? rawAge : Number(rawAge);
    return numericAge >= 19;
  };

  const flattened: FlattenedApplicant = {
    // Basic Info
    firstName: applicant.basicInfo?.legalFirstName || applicant.basicInfo?.firstName || "",
    lastName: applicant.basicInfo?.legalLastName || applicant.basicInfo?.lastName || "",
    email: applicant.basicInfo?.email || "",
    phoneNumber: applicant.basicInfo?.phoneNumber || "",
    school: applicant.basicInfo?.school || "",
    major: isLegacyFormat
      ? (applicant.basicInfo?.major as string) || ""
      : createStringFromSelection(
          applicant.basicInfo?.major as Record<string, boolean> | undefined,
          "",
        ),
    educationLevel: applicant.basicInfo?.educationLevel || "",
    graduation: applicant.basicInfo?.graduation || "",
    gender:
      typeof applicant.basicInfo?.gender === "string"
        ? applicant.basicInfo.gender
        : createStringFromSelection(
            applicant.basicInfo?.gender as Record<string, boolean> | undefined,
            "",
          ),
    isOfLegalAge: computedIsOfLegalAge(applicant),
    culturalBackground: returnTrueKey(
      applicant.basicInfo?.ethnicity || applicant.basicInfo?.culturalBackground,
    ),
    dietaryRestriction: createStringFromSelection(
      applicant.basicInfo?.dietaryRestriction,
      applicant.basicInfo?.otherDietaryRestriction
        ? `other: ${applicant.basicInfo.otherDietaryRestriction}`
        : "",
    ),

    // Application Status
    applicationStatus: applicant.status?.applicationStatus || "",

    // Skills
    role: returnTrueKey(applicant.skills?.contributionRole),
    github: applicant.skills?.github || "",
    linkedin: applicant.skills?.linkedin || "",
    portfolio: applicant.skills?.portfolio || "",
    resume: applicant.skills?.resume || "",

    firstTimeHacker: applicant.skills?.numHackathonsAttended === "0" || false,

    // Engagement source
    engagementSource: isLegacyFormat
      ? (applicant.questionnaire?.engagementSource as string) || ""
      : createStringFromSelection(
          applicant.questionnaire?.engagementSource as Record<string, boolean> | undefined,
          applicant.questionnaire?.otherEngagementSource || "",
        ),
    friendEmail: applicant.questionnaire?.friendEmail || "",

    // Terms and conditions
    MLHCodeOfConduct: applicant.termsAndConditions?.MLHCodeOfConduct || false,
    nwPlusPrivacyPolicy: applicant.termsAndConditions?.nwPlusPrivacyPolicy || false,
    shareWithSponsors: applicant.termsAndConditions?.shareWithSponsors || false,
    shareWithnwPlus: applicant.termsAndConditions?.shareWithnwPlus || false,

    // Score info
    resumeScore: applicant.score?.scores?.ResumeScore?.score || 0,
    totalScore: applicant.score?.totalScore || 0,
    totalZScore: applicant.score?.totalZScore || -Infinity,
    scoreComment: applicant.score?.comment || "",

    // Day-of info
    day1Breakfast: applicant.dayOf?.day1?.breakfast?.length || 0,
    day1Lunch: applicant.dayOf?.day1?.lunch?.length || 0,
    day1Dinner: applicant.dayOf?.day1?.dinner?.length || 0,
    day1Snack: applicant.dayOf?.day1?.snack?.length || 0,
    day2Breakfast: applicant.dayOf?.day2?.breakfast?.length || 0,
    day2Lunch: applicant.dayOf?.day2?.lunch?.length || 0,
    day2Dinner: applicant.dayOf?.day2?.dinner?.length || 0,
    checkedIn: applicant.dayOf?.checkedIn || false,
    attendedEvents:
      applicant.dayOf?.events?.map((e: { eventName: string }) => e.eventName).join(", ") || "",
    points: 0,
  };

  return flattened;
};

/**
 * Get all available columns from the flattened applicant data
 * @returns array of column names
 */
export const getAvailableColumns = (): string[] => {
  const sampleApplicant: Applicant = {
    _id: "sample",
    basicInfo: {
      legalFirstName: "",
      legalLastName: "",
      email: "",
      phoneNumber: "",
      school: "",
      major: {
        arts: false,
        business: false,
        computerScience: false,
        healthScience: false,
        humanities: false,
        informationTech: false,
        mathOrStats: false,
        naturalScience: false,
        other: false,
        otherEngineering: false,
        preferNotToAnswer: false,
        schoolDoesNotOfferMajors: false,
        socialScience: false,
        undecidedOrUndeclared: false,
        webDevOrDesign: false,
      },
      educationLevel: "Undergraduate University (3+ years)",
      graduation: 2024,
      gender: "",
      location: "",
      isOfLegalAge: true,
      ageByHackathon: "0",
      ethnicity: {
        asian: false,
        black: false,
        caucasian: false,
        hispanic: false,
        middleEastern: false,
        nativeHawaiian: false,
        northAmerica: false,
        other: false,
        preferNot: false,
      },

      dietaryRestriction: {
        celiacDisease: false,
        halal: false,
        kosher: false,
        none: false,
        other: false,
        vegan: false,
        vegetarian: false,
      },
      culturalBackground: {
        asian: false,
        black: false,
        caucasian: false,
        hispanic: false,
        middleEastern: false,
        nativeHawaiian: false,
        northAmerica: false,
        other: false,
        preferNot: false,
      },
    },
    status: {
      applicationStatus: "inProgress",
    },
    skills: {
      github: "",
      linkedin: "",
      portfolio: "",
      resume: "",
      contributionRole: {
        developer: false,
        designer: false,
        productManager: false,
        other: false,
      },
    },
    questionnaire: {
      engagementSource: "",
      friendEmail: "",
      eventsAttended: [],
    },
    termsAndConditions: {
      MLHCodeOfConduct: false,
      nwPlusPrivacyPolicy: false,
      shareWithSponsors: false,
      shareWithnwPlus: false,
    },
  };

  const flattenedApplicant = flattenApplicantData(sampleApplicant);
  return Object.keys(flattenedApplicant);
};

/**
 * Represents a flattened applicant object to display as table data in the query page
 */
export interface FlattenedApplicant {
  // Basic Info
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  school: string;
  major: string;
  educationLevel: string;
  graduation: string | number;
  gender: string;
  isOfLegalAge: boolean;
  culturalBackground: string;
  dietaryRestriction: string;

  // Application Status
  applicationStatus: string;

  // Skills
  role: string;
  github: string;
  linkedin: string;
  portfolio: string;
  resume: string;
  firstTimeHacker: boolean;

  // Questionnaire
  engagementSource: string;
  friendEmail: string;

  // Terms and conditions
  MLHCodeOfConduct: boolean;
  nwPlusPrivacyPolicy: boolean;
  shareWithSponsors: boolean;
  shareWithnwPlus: boolean;

  // Score info
  resumeScore: number;
  totalScore: number;
  totalZScore: number;
  scoreComment: string;

  // Day-of info
  day1Breakfast: number;
  day1Lunch: number;
  day1Dinner: number;
  day1Snack: number;
  day2Breakfast: number;
  day2Lunch: number;
  day2Dinner: number;
  checkedIn: boolean;
  attendedEvents: string;
  points: number;

  [key: string]: string | number | boolean | Date | null | Record<string, boolean> | undefined; // extra keys for group-by results
}

/**
 * Calculates all hackers' points from day-of events asynchronously
 *
 * @param applicants - array of unflattened applicant data
 * @param hackathon - hackathon ID
 * @returns Promise that resolves to a map of applicant email : points
 */
export const calculateApplicantPoints = async (
  applicants: Applicant[],
  hackathon: string,
): Promise<Record<string, number>> => {
  const pointsMap: Record<string, number> = {};

  try {
    const dayOfSnapshot = await getDocs(collection(db, "Hackathons", hackathon, "DayOf"));
    const allEvents = dayOfSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as HackathonDayOf,
    );

    for (const applicant of applicants) {
      let points = 0;

      if (applicant.dayOf?.events && applicant.dayOf.events.length > 0) {
        points = applicant.dayOf.events.reduce((acc, attendedEvent) => {
          const eventDoc = allEvents.find((event) => event.eventID === attendedEvent.eventId);
          return acc + Number(eventDoc?.points ?? 0);
        }, 0);
      }

      pointsMap[applicant.basicInfo?.email || ""] = points;
    }
  } catch (error) {
    console.error("Error calculating applicant points:", error);
    for (const applicant of applicants) {
      pointsMap[applicant.basicInfo?.email || ""] = 0;
    }
  }

  return pointsMap;
};
