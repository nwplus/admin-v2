import { db } from "@/lib/firebase/client";
import type { Applicant, HackathonDayOf } from "@/lib/firebase/types";
import {
  createStringFromSelection,
  getApplicantEducationLevel,
  returnTrueKey,
  splitHackathon,
} from "@/lib/utils";
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
  const numHackathonsAttended = String(applicant.skills?.numHackathonsAttended ?? "").trim();

  const computedIsOfLegalAge = (applicant: Applicant) => {
    const rawAge = applicant.basicInfo?.ageByHackathon;
    if (rawAge === "<=16" || rawAge === "≤16") return false;
    if (rawAge === ">24" || rawAge === "≥25") return true;

    const numericAge = typeof rawAge === "number" ? rawAge : Number(rawAge);
    return numericAge >= 19;
  };

  const flattened: FlattenedApplicant = {
    // Basic Info
    ageByHackathon: applicant.basicInfo?.ageByHackathon || "",
    firstName: applicant.basicInfo?.legalFirstName || applicant.basicInfo?.firstName || "",
    legalFirstName: applicant.basicInfo?.legalFirstName || "",
    preferredName: applicant.basicInfo?.preferredName || "",
    lastName: applicant.basicInfo?.legalLastName || applicant.basicInfo?.lastName || "",
    legalLastName: applicant.basicInfo?.legalLastName || "",
    email: applicant.basicInfo?.email || "",
    phoneNumber: applicant.basicInfo?.phoneNumber || "",
    phoneNumberOwnerNameAndRelationship:
      applicant.basicInfo?.phoneNumberOwnerNameAndRelationship || "",
    parentOrGuardianPhoneNumber: applicant.basicInfo?.parentOrGuardianPhoneNumber || "",
    school: applicant.basicInfo?.school || "",
    major: isLegacyFormat
      ? (applicant.basicInfo?.major as string) || ""
      : createStringFromSelection(
          applicant.basicInfo?.major as Record<string, boolean> | undefined,
          "",
        ),
    educationLevel: getApplicantEducationLevel(applicant),
    graduation: applicant.basicInfo?.graduation || "",
    gender: createStringFromSelection(
      applicant.questionnaire?.gender ?? applicant.basicInfo?.gender,
    ),
    pronouns: createStringFromSelection(applicant.basicInfo?.pronouns),
    race: createStringFromSelection(applicant.basicInfo?.race ?? applicant.questionnaire?.race),
    identifyAsUnderrepresented: applicant.basicInfo?.identifyAsUnderrepresented ?? "",
    isOfLegalAge: computedIsOfLegalAge(applicant),
    travellingToHackathon: applicant.basicInfo?.travellingToHackathon || "",
    culturalBackground: returnTrueKey(
      applicant.basicInfo?.ethnicity || applicant.basicInfo?.culturalBackground,
    ),
    dietaryRestriction: createStringFromSelection(
      applicant.basicInfo?.dietaryRestriction,
      applicant.basicInfo?.otherDietaryRestriction
        ? `other: ${applicant.basicInfo.otherDietaryRestriction}`
        : "",
    ),
    academicYear: applicant.basicInfo?.academicYear || "",
    canadianStatus: applicant.basicInfo?.canadianStatus || "",
    countryOfResidence: applicant.basicInfo?.countryOfResidence || "",
    disability: applicant.questionnaire?.disability ?? applicant.basicInfo?.disability ?? "",
    haveTransExperience:
      applicant.questionnaire?.haveTransExperience ??
      applicant.basicInfo?.haveTransExperience ??
      "",
    indigenousIdentification:
      applicant.questionnaire?.indigenousIdentification ??
      applicant.basicInfo?.indigenousIdentification ??
      "",
    jobPosition:
      applicant.questionnaire?.jobPosition ??
      applicant.skills?.jobPosition ??
      applicant.basicInfo?.jobPosition ??
      "",
    marketingFeatureCheck: applicant.basicInfo?.marketingFeatureCheck || false,
    mediaConsentCheck: applicant.basicInfo?.mediaConsentCheck || false,
    safewalkCheck: applicant.basicInfo?.safewalkCheck || false,
    sponsorEmailConsentCheck: applicant.basicInfo?.sponsorEmailConsentCheck || false,

    // Application Status
    applicationStatus: applicant.status?.applicationStatus || "",

    // Submission
    submitted: applicant.submission?.submitted ?? false,
    submittedAt: applicant.submission?.submittedAt?.toDate().toISOString() ?? "",
    lastUpdated: applicant.submission?.lastUpdated?.toDate().toISOString() ?? "",

    // Skills
    role: returnTrueKey(applicant.skills?.contributionRole),
    contributionRole: createStringFromSelection(applicant.skills?.contributionRole),
    github: applicant.skills?.github || "",
    linkedin: applicant.skills?.linkedin || "",
    portfolio: applicant.skills?.portfolio || "",
    resume: applicant.skills?.resume || "",
    connectPlus: applicant.skills?.connectPlus ?? "",
    longAnswers1: applicant.skills?.longAnswers1 || "",
    longAnswers2: applicant.skills?.longAnswers2 || "",
    longAnswers3: applicant.skills?.longAnswers3 || "",
    longAnswers4: applicant.skills?.longAnswers4 || "",
    longAnswers5: applicant.skills?.longAnswers5 || "",
    longAnswers6: applicant.skills?.longAnswers6 || "",

    numHackathonsAttended,
    firstTimeHacker: numHackathonsAttended === "0",

    // Engagement source
    engagementSource: createStringFromSelection(
      applicant.questionnaire?.engagementSource,
      applicant.questionnaire?.otherEngagementSource || "",
    ),
    eventsAttended: createStringFromSelection(applicant.questionnaire?.eventsAttended),
    friendEmail: applicant.questionnaire?.friendEmail || "",

    // Terms and conditions
    MLHCodeOfConduct: applicant.termsAndConditions?.MLHCodeOfConduct || false,
    MLHPrivacyPolicy: applicant.termsAndConditions?.MLHPrivacyPolicy || false,
    MLHEmailSubscription: applicant.termsAndConditions?.MLHEmailSubscription || false,
    nwPlusPrivacyPolicy: applicant.termsAndConditions?.nwPlusPrivacyPolicy || false,
    shareWithSponsors: applicant.termsAndConditions?.shareWithSponsors || false,
    shareWithnwPlus: applicant.termsAndConditions?.shareWithnwPlus || false,

    // Score info
    resumeScore: applicant.score?.scores?.ResumeScore?.score || 0,
    totalScore: applicant.score?.totalScore || 0,
    totalZScore: applicant.score?.totalZScore || Number.NEGATIVE_INFINITY,
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
      preferredName: "",
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
      travellingToHackathon: "",
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
      academicYear: "",
      canadianStatus: "",
      countryOfResidence: "",
      disability: "",
      haveTransExperience: "",
      indigenousIdentification: "",
      jobPosition: "",
      marketingFeatureCheck: false,
      mediaConsentCheck: false,
      safewalkCheck: false,
      sponsorEmailConsentCheck: false,
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
      eventsAttended: {},
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
  legalFirstName: string;
  preferredName: string;
  lastName: string;
  legalLastName: string;
  email: string;
  phoneNumber: string;
  phoneNumberOwnerNameAndRelationship: string;
  parentOrGuardianPhoneNumber: string;
  school: string;
  major: string;
  educationLevel: string;
  graduation: string | number;
  gender: string;
  pronouns: string;
  race: string;
  identifyAsUnderrepresented: boolean | string;
  ageByHackathon: string;
  isOfLegalAge: boolean;
  travellingToHackathon: string;
  culturalBackground: string;
  dietaryRestriction: string;
  academicYear: string;
  canadianStatus: string;
  countryOfResidence: string;
  disability: string;
  haveTransExperience: string;
  indigenousIdentification: string;
  jobPosition: string;
  marketingFeatureCheck: boolean;
  mediaConsentCheck: boolean;
  safewalkCheck: boolean;
  sponsorEmailConsentCheck: boolean;

  // Application Status
  applicationStatus: string;

  // Submission
  submitted: boolean;
  submittedAt: string;
  lastUpdated: string;

  // Skills
  role: string;
  contributionRole: string;
  github: string;
  linkedin: string;
  portfolio: string;
  resume: string;
  connectPlus: boolean | string;
  longAnswers1: string;
  longAnswers2: string;
  longAnswers3: string;
  longAnswers4: string;
  longAnswers5: string;
  longAnswers6: string;
  numHackathonsAttended: string;
  firstTimeHacker: boolean;

  // Questionnaire
  engagementSource: string;
  eventsAttended: string;
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

export const CATEGORICAL_COLUMNS: ReadonlySet<string> = new Set([
  "applicationStatus",
  "educationLevel",
  "major",
  "role",
  "dietaryRestriction",
  "culturalBackground",
  "school",
  "gender",
  "countryOfResidence",
  "academicYear",
  "canadianStatus",
  "disability",
  "haveTransExperience",
  "indigenousIdentification",
  "jobPosition",
  "travellingToHackathon",
  "engagementSource",
  "eventsAttended",
  "ageByHackathon",
  "graduation",
  "numHackathonsAttended",
]);

export const MULTI_VALUE_COLUMNS: ReadonlySet<string> = new Set([
  "major",
  "gender",
  "dietaryRestriction",
  "culturalBackground",
  "role",
  "engagementSource",
  "eventsAttended",
]);

export const extractColumnValues = (applicants: FlattenedApplicant[]): Record<string, string[]> => {
  const result: Record<string, string[]> = {};
  for (const column of CATEGORICAL_COLUMNS) {
    const values = new Set<string>();
    const isMultiValue = MULTI_VALUE_COLUMNS.has(column);
    for (const applicant of applicants) {
      const raw = applicant[column];
      if (raw === null || raw === undefined) continue;
      if (isMultiValue) {
        for (const token of String(raw).split(",")) {
          const trimmed = token.trim();
          if (trimmed) values.add(trimmed);
        }
      } else {
        const trimmed = String(raw).trim();
        if (trimmed) values.add(trimmed);
      }
    }
    result[column] = [...values].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }
  return result;
};

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
