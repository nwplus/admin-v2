import { Loading } from "@/components/ui/loading";
import type { Applicant, ScoringCriteria } from "@/lib/firebase/types";
import {
  getAdminFlags,
  subscribeLongAnswerQuestions,
  subscribeToApplicants,
} from "@/services/evaluator";
import { type ReactNode, createContext, useContext, useEffect, useState } from "react";

export interface EvaluatorContextType {
  hackathon: string;
  applicants: Applicant[];
  focusedApplicant: Applicant | null;
  setHackathon: React.Dispatch<React.SetStateAction<string>>;
  setScoringCriteria: React.Dispatch<React.SetStateAction<ScoringCriteria[]>>;
  setFocusedApplicant: React.Dispatch<React.SetStateAction<Applicant | null>>;
  scoringCriteria: ScoringCriteria[];
  questionLabels: Record<string, string>;
}

export const EvaluatorContext = createContext<EvaluatorContextType | null>(null);

const EvaluatorProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hackathon, setHackathon] = useState<string>("");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [focusedApplicant, setFocusedApplicant] = useState<Applicant | null>(null);
  const [scoringCriteria, setScoringCriteria] = useState<ScoringCriteria[]>([]);
  const [questionLabels, setQuestionLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    let unsubApplicants: (() => void) | null = null;
    const fetchAndSubscribe = async () => {
      try {
        const adminConfig = await getAdminFlags();
        if (hackathon === "") {
          setHackathon(adminConfig?.activeHackathon ?? "");
        }
        setScoringCriteria(adminConfig?.evaluator?.criteria ?? []);
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
  }, [hackathon]);

  useEffect(() => {
    if (!hackathon) return;

    setFocusedApplicant(null);

    const unsubLongAnswerQuestions = subscribeLongAnswerQuestions(hackathon, (questions) => {
      const labelMap = questions.reduce(
        (acc, q, index) => {
          const key = `skills.${q.formInput}`;
          acc[key] = `Q${index + 1} - ${q.description}`;
          return acc;
        },
        {} as Record<string, string>,
      );

      setQuestionLabels(labelMap);
    });

    return () => unsubLongAnswerQuestions();
  }, [hackathon]);

  const value = {
    hackathon,
    applicants,
    focusedApplicant,
    scoringCriteria,
    setHackathon,
    setScoringCriteria,
    setFocusedApplicant,
    questionLabels,
  };

  return (
    <EvaluatorContext.Provider value={value}>
      {isLoading ? <Loading /> : children}
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
