import { useHackerApplication } from "@/providers/hacker-application-provider";
import { HackerAppSection } from "./hacker-app-section";

export function HackerAppMain() {
  const { basicInfo, welcome, skills, questionnaire, metadata } = useHackerApplication();

  return (
    <div className="flex flex-col gap-3 overflow-auto">
      <HackerAppSection
        section="Welcome"
        title="Welcome"
        description="Welcome the hackers!"
        data={welcome}
        metadata={metadata.Welcome}
      />
      <HackerAppSection
        section="BasicInfo"
        title="Basics"
        description="Basic hacker information"
        data={basicInfo}
        metadata={metadata.BasicInfo}
      />
      <HackerAppSection
        section="Skills"
        title="Skills"
        description="Skill and contribution questions"
        data={skills}
        metadata={metadata.Skills}
      />
      <HackerAppSection
        section="Questionnaire"
        title="Questionnaire"
        description="For waiver and statistics"
        data={questionnaire}
        metadata={metadata.Questionnaire}
      />
    </div>
  );
}
