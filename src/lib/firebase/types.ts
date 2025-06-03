import type { Timestamp } from "firebase/firestore";

export type ApplicantMajor =
  | "computerScience"
  | "otherEngineering"
  | "informationTech"
  | "naturalScience"
  | "mathOrStats"
  | "webDevOrDesign"
  | "business"
  | "humanities"
  | "socialScience"
  | "arts"
  | "healthScience"
  | "other"
  | "undecidedOrUndeclared"
  | "schoolDoesNotOfferMajors"
  | "preferNotToAnswer";

export type ApplicationStatus =
  | "inProgress"
  | "applied"
  | "gradinginprog"
  | "waitlisted"
  | "scored"
  | "rejected"
  | "completed"
  | "acceptedNoResponseYet"
  | "acceptedAndAttending"
  | "acceptedUnRSVP";

type FAQCategory = "General" | "Logistics" | "Teams & Projects" | "Miscellaneous";
type ApplicantContributionRole = "developer" | "designer" | "productManager" | "other";
export type ApplicantContribution = Record<ApplicantContributionRole, boolean>;

/**
 *  Collection: /FAQ
 */
export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  hackathonIDs: string[];
  lastModified: Timestamp;
  lastModifiedBy: string; // Email
}

/**
 *  Collection: /Hackathons (doesn't include subcollections)
 */
export interface Hackathon {
  _id: string;
  featureFlags?: {
    isOpen?: boolean;
    registrationOpen?: boolean;
    test?: boolean;
  };
  sponsorPrizes?: string[];
}

export interface ApplicantScoreItem {
  lastUpdated?: Timestamp;
  lastUpdatedBy?: string; // email
  normalizedScore?: number;
  score?: number;
}

/**
 *  Sub-collection: /Hackathons/[Hackathon]/Applicants
 */
export interface Applicant {
  _id: string;
  basicInfo: {
    educationLevel: ApplicantMajor;
    email: string;
    firstName: string;
    lastName: string;
    gender: string | Record<string, boolean>;
    graduation: number;
    isOfLegalAge: boolean;
    location: string; // city
    major: string; // could be typed
    phoneNumber: string; // "+1 XXX-XXX-XXXX"
    school: string; // should be typed
    ethnicity: {
      asian: boolean;
      black: boolean;
      caucasian: boolean;
      hispanic: boolean;
      middleEastern: boolean;
      nativeHawaiian: boolean;
      northAmerica: boolean;
      other: boolean;
      preferNot: boolean;
    };
  };
  score?: {
    comment?: string;
    lastUpdated?: Timestamp;
    lastUpdatedBy?: string;
    scores?: Record<string, ApplicantScoreItem>;
    totalScore?: number;
  };
  questionnaire?: {
    engagementSource?: string | Record<string, boolean>;
    eventsAttended?: string[];
    friendEmail?: string;
    otherEngagementSource?: string;
  };
  skills?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
    resume?: string;
    numHackathonsAttended?: number;
    contributionRole?: ApplicantContribution;
  };
  status?: {
    // could do some clean up here
    applicationStatus?: ApplicationStatus;
    attending?: boolean;
    responded?: boolean;
  };
  submission?: {
    lastUpdated?: Timestamp;
    submitted?: boolean;
  };
  termsAndConditions?: {
    MLHCodeOfConduct?: boolean;
    nwPlusPrivacyPolicy?: boolean;
    shareWithSponsors?: boolean;
    shareWithnwPlus?: boolean;
  };
}

export interface InternalWebsitesCMS {
  activeHackathon?: string;
  offUntilDate?: boolean; // not sure what this is for
  targetSite?: string;
}
