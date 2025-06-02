import type { Timestamp } from "firebase/firestore";

type FAQCategory = "General" | "Logs" | "Teams & Projects" | "Miscellaneous";

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
