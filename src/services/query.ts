import { db } from "@/lib/firebase/client";
import type { Applicant } from "@/lib/firebase/types";
import { collection, onSnapshot, query } from "firebase/firestore";
import { returnTrueKey, createStringFromSelection } from "@/lib/utils";

/**
 * Utility function that returns Applicants collection realtime data for a specific hackathon
 * @param hackathon - The hackathon collection of the applicants to query
 * @param callback - The function used to ingest the data
 * @returns a listener function to be called on dismount
 */
export const subscribeToApplicants = (hackathon: string, callback: (docs: Applicant[]) => void) =>
  onSnapshot(query(collection(db, "Hackathons", hackathon, "Applicants")), (querySnapshot) => {
    const applicants = [];
    for (const doc of querySnapshot.docs) {
      applicants.push({
        ...(doc.data() as unknown as Applicant),
        _id: doc.id,
      });
    }
    callback(applicants);
  });

/**
 * Utility function to flatten applicant data for table display
 * @param applicant - The applicant object to flatten
 * @returns a flattened object with all properties at the top level
 */
export const flattenApplicantData = (applicant: Applicant): FlattenedApplicant => {
  const flattened: FlattenedApplicant = {
    // Basic Info
    firstName: applicant.basicInfo?.legalFirstName || applicant.basicInfo?.firstName || "",
    lastName: applicant.basicInfo?.legalLastName || applicant.basicInfo?.lastName || "",
    email: applicant.basicInfo?.email || "",
    phoneNumber: applicant.basicInfo?.phoneNumber || "",
    school: applicant.basicInfo?.school || "",
    major: createStringFromSelection(
      applicant.basicInfo?.major as Record<string, boolean> | undefined,
      ''
    ),
    educationLevel: applicant.basicInfo?.educationLevel || "",
    graduation: applicant.basicInfo?.graduation || "",
    gender: typeof applicant.basicInfo?.gender === 'string'
      ? applicant.basicInfo.gender
      : createStringFromSelection(
          applicant.basicInfo?.gender as Record<string, boolean> | undefined,
          ''
        ),
    isOfLegalAge: applicant.basicInfo?.isOfLegalAge || false,
    culturalBackground: returnTrueKey(applicant.basicInfo?.ethnicity || applicant.basicInfo?.culturalBackground),
    dietaryRestriction: createStringFromSelection(
      applicant.basicInfo?.dietaryRestriction,
      ''
    ),
    
    // Application Status
    applicationStatus: applicant.status?.applicationStatus || "",
    
    // Skills
    role: returnTrueKey(applicant.skills?.contributionRole),
    github: applicant.skills?.github || "",
    linkedin: applicant.skills?.linkedin || "",
    portfolio: applicant.skills?.portfolio || "",
    resume: applicant.skills?.resume || "",
    firstTimeHacker: applicant.skills?.numHackathonsAttended == 0 || false,
    
    // Engagement source
    engagementSource: createStringFromSelection(
      applicant.questionnaire?.engagementSource as Record<string, boolean> | undefined,
      applicant.questionnaire?.otherEngagementSource || ''
    ),
    friendEmail: applicant.questionnaire?.friendEmail || "",
    
    // Terms and conditions
    MLHCodeOfConduct: applicant.termsAndConditions?.MLHCodeOfConduct || false,
    nwPlusPrivacyPolicy: applicant.termsAndConditions?.nwPlusPrivacyPolicy || false,
    shareWithSponsors: applicant.termsAndConditions?.shareWithSponsors || false,
    shareWithnwPlus: applicant.termsAndConditions?.shareWithnwPlus || false,
    
    // Score info
    totalScore: applicant.score?.totalScore || 0,
    scoreComment: applicant.score?.comment || "",
    
    // Day-of info
    day1Breakfast: applicant.dayOf?.day1?.breakfast?.length || 0,
    day1Lunch: applicant.dayOf?.day1?.lunch?.length || 0,
    day1Dinner: applicant.dayOf?.day1?.dinner?.length || 0,
    day2Breakfast: applicant.dayOf?.day2?.breakfast?.length || 0,
    day2Lunch: applicant.dayOf?.day2?.lunch?.length || 0,
    day2Dinner: applicant.dayOf?.day2?.dinner?.length || 0,
    checkedIn: applicant.dayOf?.checkedIn || false,
    attendedEvents: applicant.dayOf?.events?.map((e: { eventName: string }) => e.eventName).join(', ') || '',
    points: 0, // This will need to be calculated separately as it requires async operations
  };
  
  return flattened;
};

/**
 * Get all available columns from the flattened applicant data
 * @returns array of column names
 */
export const getAvailableColumns = () => {
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
      educationLevel: "computerScience",
      graduation: 2024,
      gender: "",
      location: "",
      isOfLegalAge: true,
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
      }
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
      }
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
    }
  };
  
  return Object.keys(flattenApplicantData(sampleApplicant));
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
  totalScore: number;
  scoreComment: string;
  
  // Day-of info
  day1Breakfast: number;
  day1Lunch: number;
  day1Dinner: number;
  day2Breakfast: number;
  day2Lunch: number;
  day2Dinner: number;
  checkedIn: boolean;
  attendedEvents: string;
  points: number; // TODO: have a helper to calculate calculate this async
  
  [key: string]: string | number | boolean | Date | null | Record<string, boolean> | undefined; // extra keys for group-by results
}