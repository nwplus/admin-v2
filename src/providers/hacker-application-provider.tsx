import { subscribeToHackerAppDoc, subscribeToHackerAppQuestions } from "@/lib/firebase/firestore";
import type { HackerApplicationMetadata, HackerApplicationQuestion } from "@/lib/firebase/types";
import { type ReactNode, createContext, useContext, useEffect, useState } from "react";

export interface HackerApplicationContextType {
  activeHackathonName: string; // does not contain YYYY
  metadata: HackerApplicationMetadata;
  basicInfo: HackerApplicationQuestion[];
  questionnaire: HackerApplicationQuestion[];
  skills: HackerApplicationQuestion[];
  welcome: HackerApplicationQuestion[];
  isLoading: boolean;
}

export const HackathonContext = createContext<HackerApplicationContextType | null>(null);

const HackerApplicationProvider = ({
  activeHackathonName,
  children,
}: { activeHackathonName: string; children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [metadata, setMetadata] = useState<HackerApplicationMetadata>(
    {} as HackerApplicationMetadata,
  );
  const [basicInfo, setBasicInfo] = useState<HackerApplicationQuestion[]>([]);
  const [questionnaire, setQuestionnaire] = useState<HackerApplicationQuestion[]>([]);
  const [skills, setSkills] = useState<HackerApplicationQuestion[]>([]);
  const [welcome, setWelcome] = useState<HackerApplicationQuestion[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToHackerAppQuestions(activeHackathonName, (data) => {
      setBasicInfo(data.BasicInfo);
      setQuestionnaire(data.Questionnaire);
      setSkills(data.Skills);
      setWelcome(data.Welcome);
      setIsLoading(false);
    });
    const unsubDoc = subscribeToHackerAppDoc(activeHackathonName, (data) => {
      setMetadata(data);
    });

    return () => {
      unsubscribe();
      unsubDoc();
    };
  }, [activeHackathonName]);

  const value = {
    activeHackathonName,
    metadata,
    basicInfo,
    questionnaire,
    skills,
    welcome,
    isLoading,
  };

  return (
    <HackathonContext.Provider value={value}>
      {isLoading ? <>Loading</> : children}
    </HackathonContext.Provider>
  );
};

export const useHackerApplication = () => {
  const context = useContext(HackathonContext);
  if (!context) {
    throw new Error("userHackerApplication must be used within an HackathonContext");
  }
  return context;
};

export default HackerApplicationProvider;
