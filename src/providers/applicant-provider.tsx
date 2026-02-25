import { type ReactNode, createContext, useContext, useEffect, useState } from "react";
import { subscribeToHackathons } from "@/lib/firebase/firestore";
import { subscribeToApplicants, flattenApplicantData } from "@/services/query";
import type { FlattenedApplicant } from "@/services/query";
import type { Hackathon } from "@/lib/firebase/types";

export interface ApplicantContextType {
  hackathons: Hackathon[];
  selectedHackathon: string;
  setSelectedHackathon: (hackathon: string) => void;
  applicants: FlattenedApplicant[];
  isLoading: boolean;
}

export const ApplicantContext = createContext<ApplicantContextType | null>(null);

/**
 * Maintains state of applicant data based on the selected hackathon.
 *
 * Primarily used in the query page.
 */
export function ApplicantProvider({ children }: { children: ReactNode }) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<string>("");
  const [applicants, setApplicants] = useState<FlattenedApplicant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToHackathons((hackathons) => {
      setHackathons(hackathons);
      if (hackathons.length > 0 && !selectedHackathon) {
        setSelectedHackathon(hackathons[hackathons.length - 2]._id);
      }
    });
    return () => unsubscribe();
  }, [selectedHackathon]);

  useEffect(() => {
    if (!selectedHackathon) return;

    const unsubscribe = subscribeToApplicants(selectedHackathon, (applicants) => {
      const flattenedApplicants = applicants.map((applicant) =>
        flattenApplicantData(applicant, selectedHackathon),
      );
      setApplicants(flattenedApplicants);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [selectedHackathon]);

  const value = {
    hackathons,
    selectedHackathon,
    setSelectedHackathon,
    applicants,
    isLoading,
  };

  return (
    <ApplicantContext.Provider value={value}>
      {isLoading ? <>Loading</> : children}
    </ApplicantContext.Provider>
  );
}

export const useApplicant = () => {
  const context = useContext(ApplicantContext);
  if (!context) {
    throw new Error("useApplicant must be used within an ApplicantProvider");
  }
  return context;
};
