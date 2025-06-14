import { db } from "@/lib/firebase/client";
import type { Applicant } from "@/lib/firebase/types";
import { collection, onSnapshot, query } from "firebase/firestore";

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
export const flattenApplicantData = (applicant: Applicant) => {
  const flattened: Record<string, any> = {
    _id: applicant._id,
    // Basic Info
    firstName: applicant.basicInfo?.legalFirstName || applicant.basicInfo?.firstName || "",
    lastName: applicant.basicInfo?.legalLastName || applicant.basicInfo?.lastName || "",
    email: applicant.basicInfo?.email || "",
    phoneNumber: applicant.basicInfo?.phoneNumber || "",
    school: applicant.basicInfo?.school || "",
    major: applicant.basicInfo?.major || "",
    educationLevel: applicant.basicInfo?.educationLevel || "",
    graduation: applicant.basicInfo?.graduation || "",
    gender: applicant.basicInfo?.gender || "",
    location: applicant.basicInfo?.location || "",
    isOfLegalAge: applicant.basicInfo?.isOfLegalAge || false,
    
    // Application Status
    applicationStatus: applicant.status?.applicationStatus || "",
    attending: applicant.status?.attending || false,
    responded: applicant.status?.responded || false,
    
    // Skills
    github: applicant.skills?.github || "",
    linkedin: applicant.skills?.linkedin || "",
    portfolio: applicant.skills?.portfolio || "",
    resume: applicant.skills?.resume || "",
    numHackathonsAttended: applicant.skills?.numHackathonsAttended || 0,
    
    // Contribution roles (flattened)
    contributionDeveloper: applicant.skills?.contributionRole?.developer || false,
    contributionDesigner: applicant.skills?.contributionRole?.designer || false,
    contributionProductManager: applicant.skills?.contributionRole?.productManager || false,
    contributionOther: applicant.skills?.contributionRole?.other || false,
    
    // Questionnaire
    engagementSource: applicant.questionnaire?.engagementSource || "",
    friendEmail: applicant.questionnaire?.friendEmail || "",
    eventsAttended: Array.isArray(applicant.questionnaire?.eventsAttended) 
      ? applicant.questionnaire?.eventsAttended.join(", ") 
      : "",
    
    // Terms and conditions
    MLHCodeOfConduct: applicant.termsAndConditions?.MLHCodeOfConduct || false,
    nwPlusPrivacyPolicy: applicant.termsAndConditions?.nwPlusPrivacyPolicy || false,
    shareWithSponsors: applicant.termsAndConditions?.shareWithSponsors || false,
    shareWithnwPlus: applicant.termsAndConditions?.shareWithnwPlus || false,
    
    // Ethnicity (flattened)
    ethnicityAsian: applicant.basicInfo?.ethnicity?.asian || false,
    ethnicityBlack: applicant.basicInfo?.ethnicity?.black || false,
    ethnicityCaucasian: applicant.basicInfo?.ethnicity?.caucasian || false,
    ethnicityHispanic: applicant.basicInfo?.ethnicity?.hispanic || false,
    ethnicityMiddleEastern: applicant.basicInfo?.ethnicity?.middleEastern || false,
    ethnicityNativeHawaiian: applicant.basicInfo?.ethnicity?.nativeHawaiian || false,
    ethnicityNorthAmerica: applicant.basicInfo?.ethnicity?.northAmerica || false,
    ethnicityOther: applicant.basicInfo?.ethnicity?.other || false,
    ethnicityPreferNot: applicant.basicInfo?.ethnicity?.preferNot || false,
    
    // Score info
    totalScore: applicant.score?.totalScore || 0,
    scoreComment: applicant.score?.comment || "",
    scoreLastUpdated: applicant.score?.lastUpdated?.toDate?.() || null,
    scoreLastUpdatedBy: applicant.score?.lastUpdatedBy || "",
    
    // Submission info
    submitted: applicant.submission?.submitted || false,
    submissionLastUpdated: applicant.submission?.lastUpdated?.toDate?.() || null,
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
      major: "",
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
      }
    },
    status: {
      applicationStatus: "inProgress",
      attending: false,
      responded: false,
    },
    skills: {
      github: "",
      linkedin: "",
      portfolio: "",
      resume: "",
      numHackathonsAttended: 0,
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
