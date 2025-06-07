import type { Applicant } from "@/lib/firebase/types";
import { getAdminFlags, subscribeToApplicants } from "@/services/evaluator";
import { type ReactNode, createContext, useContext, useEffect, useState } from "react";

export interface EvaluatorContextType {
  hackathon: string;
  applicants: Applicant[];
  focusedApplicant: Applicant | null;
  setFocusedApplicant: React.Dispatch<React.SetStateAction<Applicant | null>>;
}

export const EvaluatorContext = createContext<EvaluatorContextType | null>(null);

const EvaluatorProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hackathon, setHackathon] = useState<string>("");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [focusedApplicant, setFocusedApplicant] = useState<Applicant | null>(null);

  useEffect(() => {
    let unsubApplicants: (() => void) | null = null;
    const fetchAndSubscribe = async () => {
      try {
        const adminConfig = await getAdminFlags();
        setHackathon(adminConfig?.activeHackathon ?? "");
        if (!adminConfig?.activeHackathon) throw new Error("No activeHackathon flag set in CMS");
        unsubApplicants = subscribeToApplicants(
          adminConfig?.activeHackathon,
          (applicants: Applicant[]) => {
            setApplicants(applicants);
          },
        );
      } catch (error) {
        console.error("Error fetching applicants: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndSubscribe();
    return () => unsubApplicants?.();
  }, []);

  const value = {
    hackathon,
    applicants,
    focusedApplicant,
    setFocusedApplicant,
  };

  return (
    <EvaluatorContext.Provider value={value}>
      {isLoading ? <div>Loading</div> : children}
    </EvaluatorContext.Provider>
  );
};

export const useEvaluator = () => {
  const context = useContext(EvaluatorContext);
  if (!context) {
    throw new Error("useEvaluator must be used within an EvaluatorContext");
  }
  return context;
};

export default EvaluatorProvider;
