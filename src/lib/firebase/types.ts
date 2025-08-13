import type { Timestamp } from "firebase/firestore";
import type { SortingState } from "@tanstack/react-table";

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

export type ApplicantEducationLevel = 
  | "Less than Secondary / High School"
  | "Secondary / High School"
  | "Undergraduate University (2 year - community college or similar)"
  | "Undergraduate University (3+ years)"
  | "Graduate University (Masters, Doctoral, Professional, etc.)"
  | "Code School / Bootcamp"
  | "Other Vocational / Trade Program or Apprenticeship" 
  | "Post-Doctorate" 
  | "I'm not currently a student" 
  | "Prefer not to answer";

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

/**
 *  Sub-collection: /Hackathons/[hackathon]/DayOf
 *
 *  Hackathon schedule
 */
export type HackathonDayOfTypes = "main" | "workshops" | "minievents";
export interface HackathonDayOf {
  _id?: string; // will be the internal id
  eventID?: string; // the doc's ID (analogous to _id)
  key?: string; // ... also the doc's ID
  name?: string;
  location?: string;
  points?: string; // of a number
  type?: HackathonDayOfTypes;
  description?: string;
  startTime?: string;
  endTime?: string;
  isDelayed?: boolean;
  lastModified?: Timestamp;
  lastModifiedBy?: string;
}

/**
 *  Sub-collection: /Hackathon/[hackathon]/Projects
 *
 *  Hackathon (HackCamp) peer-judging project submissions
 */
export interface HackathonProjects {
  title?: string;
  charityChoice?: string;
  countAssigned?: string; // but is a number
  description?: string;
  draftStatus?: string; // 'draft' or ..
  links?: {
    sourceode?: string;
  };
  mentorNomination?: string;
  sponsorPrizes?: string[];
  teamMembers?: {
    email?: string;
    id?: string; // of the user
    name?: string;
  }[];
}

/**
 *  Sub-collection: /Hackathon/[hackathon]/Rewards
 *
 *  Hackathon rewards
 */
export interface HackathonRewards {
  _id?: string; // FE
  key?: string; // the doc ID
  blurb?: string;
  from?: string;
  reward?: string;
  type?: "Reward" | "Raffle";
  imgName?: string;
  imgURL?: string;
  lastmod?: Timestamp; // should be `lastModified`
  lastmodBy?: string; // ...
  prizesAvailable?: string; // holds a number
  requiredPoints?: string; // holds a number
}

/**
 * Sub-collection: /Hackathon/[hackathon]/Sponsors
 */
export interface HackathonSponsors {
  _id?: string;
  blurb?: string;
  imgName?: string;
  imgURL?: string;
  lastmod?: Timestamp;
  lastmodBy?: string;
  link?: string;
  name?: string;
  tier?: HackathonSponsorTiers;
}
export type HackathonSponsorTiers =
  | "inkind"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "title"
  | "startup";

/**
 *  Sub-collection: /Hackathons/[Hackathon]/Applicants
 */
export interface Applicant {
  _id: string;
  basicInfo: {
    educationLevel: ApplicantEducationLevel;
    email: string;
    firstName?: string;
    lastName?: string;
    legalFirstName: string;
    legalLastName: string;
    gender: string | Record<string, boolean>;
    graduation: number;
    isOfLegalAge: boolean;
    location: string; // city
    major: ApplicantMajor | Record<string, boolean>;
    phoneNumber: string; // "+1 XXX-XXX-XXXX"
    school: string; // should be typed
    ethnicity?: {
      asian: boolean;
      black: boolean;
      caucasian: boolean;
      hispanic: boolean;
      middleEastern: boolean;
      nativeHawaiian: boolean;
      northAmerica: boolean;
      other: boolean;
      preferNot: boolean;
    }; // deprecated, including for backwards compatibility
    culturalBackground?: {
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
    dietaryRestriction?: {
      celiacDisease: boolean;
      halal: boolean;
      kosher: boolean;
      none: boolean;
      other: boolean;
      vegan: boolean;
      vegetarian: boolean;
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
  dayOf?: {
    day1?: {
      breakfast?: Timestamp[];
      lunch?: Timestamp[];
      dinner?: Timestamp[];
    };
    day2?: {
      breakfast?: Timestamp[];
      lunch?: Timestamp[];
      dinner?: Timestamp[];
    };
    checkedIn?: boolean;
    events?: Array<{
      eventId: string;
      eventName: string;
      timestamp: Timestamp;
    }>;
  };
  termsAndConditions?: {
    MLHCodeOfConduct?: boolean;
    nwPlusPrivacyPolicy?: boolean;
    shareWithSponsors?: boolean;
    shareWithnwPlus?: boolean;
  };
}

export interface ApplicantScoreItem {
  lastUpdated?: Timestamp;
  lastUpdatedBy?: string; // email
  normalizedScore?: number;
  score?: number;
}

export interface InternalWebsitesCMS {
  activeHackathon?: string;
  offUntilDate?: boolean; // not sure what this is for
  targetSite?: string;
}

/**
 *  Collection: /HackerAppQuestions
 *
 *  Hacker app
 */
export type HackerApplicationSections = "BasicInfo" | "Questionnaire" | "Skills" | "Welcome";
export type HackerApplicationQuestionType =
  | "Long Answer"
  | "Portfolio"
  | "Select All"
  | "Multiple Choice" // single
  | "Full Legal Name"
  | "Short Answer"
  | "Dropdown"
  | "School"
  | "Major"
  | "Country";
export type HackerApplicationQuestionFormInputField =
  | "academicYear"
  | "ageByHackathon"
  | "canadianStatus"
  | "culturalBackground"
  | "dietaryRestriction"
  | "disability"
  | "educationLevel"
  | "email"
  | "gender"
  | "graduation"
  | "haveTransExperience"
  | "identifyAsUnderrepresented"
  | "indigenousIdentification"
  | "phoneNumber"
  | "preferredName"
  | "pronouns"
  | "race"
  | "jobPosition";
export interface HackerApplicationQuestion {
  _id?: string; // internal
  title?: string;
  content?: string; // only for welcome message
  description?: string; // q description
  formInput?: HackerApplicationQuestionFormInputField; // name of input's value
  options?: string[]; // for select and multiselect
  other?: boolean; // for 'other' responses
  required?: boolean;
  type?: HackerApplicationQuestionType;
  maxWords?: string; // b/c portal uses it
}
export type HackerApplicationMetadataInfo = {
  lastEditedAt: Timestamp;
  lastEditedBy: string;
};
export type HackerApplicationMetadata = Record<
  HackerApplicationSections,
  HackerApplicationMetadataInfo
>;

export interface DiscordQuestion {
  id?: string;
  sponsor?: string;
  question?: string;
  answer?: string[];
  needAllAnswers?: boolean;
  lastModified?: Timestamp;
  lastModifiedBy?: string;
}

export interface GeneralConfig {
  channelIds?: {
    adminConsole?: string;
    adminLog?: string;
  };
  hackathonName?: string;
  roleIds?: {
    admin?: string;
    hacker?: string;
    mentor?: string;
    staff?: string;
    unverified?: string;
    verified?: string;
  };
  isSetupComplete?: boolean;
}

export interface TicketsConfig {
  channelIds?: {
    incomingTicketsChannel?: string;
  };
  currentTicketCount?: number;
  extraSpecialties?: string;
  roleIds?: {
    requestTicketRole?: string;
  };
  savedMessages?: {
    mentorSpecialtySelection?: {
      channelId?: string;
      messageId?: string;
    };
    requestTicket?: {
      channelId?: string;
      messageId?: string;
    };
  };
  unansweredTicketTime?: number;
}

export interface VerificationConfig {
  roleIds?: {
    hacker?: string;
    mentor?: string;
    organizer?: string;
    photographer?: string;
    sponsor?: string;
    volunteer?: string;
  };
  savedMessage?: {
    channelId?: string;
    messageId?: string;
  };
}

export interface DevConfig {
  id: string;
  GeneralConfig?: GeneralConfig;
  VerificationConfig?: VerificationConfig;
  TicketsConfig?: TicketsConfig;
}

export interface ContestQuestion {
  username: string;
  email: string;
  type: string;
  firstname: string;
  lastname: string;
  preferredname: string;
  phonenumber: string;
}

/**
 * Collection: /InternalWebsites/Livesite
 * 
 * Current active hackathon's config and settings
 */
export interface LivesiteSettings {
  _id?: string;
  activeHackathon?: string;
  applicationDeadline?: string;
  applicationsOpen?: boolean;
  hackathonEnd?: string;
  hackathonStart?: string;
  hackathonWeekend?: string;
  hackingEnd?: string;
  hackingStart?: string;
  imgUrl?: string;
  judgingOpen?: boolean;
  judgingReleased?: boolean;
  lastEdited?: Timestamp;
  lastEditedBy?: string;
  livePortalLink?: string;
  offWaitlistNotify?: string;
  rsvpBy?: string;
  sendAcceptancesBy?: string;
  submissionsOpen?: boolean;
}

/** QUERY TYPES */
export interface FirebaseQuery {
  id: string;
  description?: string;
  selectedColumns: string[];
  filterSelections: FilterRowsSelection[];
  groupBySelection?: GroupBySelection;
  sorting: SortingState;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPublic: boolean;
  tags?: string[];
}

export type FilterCondition = "matches" | "does_not_match" | "equals" | "not_equals" | "greater_than" | "less_than";

export type AggregationFunction = "COUNT" | "SUM" | "AVERAGE" | "MIN" | "MAX";

export type ApplicantFieldValue = string | number | boolean | Date | null | Record<string, boolean> | undefined;

export interface GroupBySelection {
  groupByColumn: string;
  aggregationFunction: string;
  aggregationColumn: string;
}

export interface FilterRowsSelection {
  id: string;
  filterColumn: string;
  filterCondition: string;
  filterValue: string;
  logicalOperator?: 'AND' | 'OR';
}

export interface SavedQueryCategory {
  id: string;
  name: string;
  description?: string;
  queries: FirebaseQuery[];
}

export interface QueryTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  query: Partial<FirebaseQuery>;
  isSystemTemplate: boolean;
}