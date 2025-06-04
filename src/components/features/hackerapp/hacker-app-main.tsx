import { useHackerApplication } from "@/providers/hacker-application-provider";
import { HackerAppSection } from "./hacker-app-section";

export function HackerAppMain() {
  const { basicInfo, welcome, skills, questionnaire } = useHackerApplication();

  return (
    <div className="flex flex-col gap-3 overflow-auto rounded-xl">
      <HackerAppSection title="Welcome" data={welcome} />
      <HackerAppSection title="Basics" data={basicInfo} />
      <HackerAppSection title="Skills" data={skills} />
      <HackerAppSection title="Questionnaire" data={questionnaire} />
    </div>
  );
}
