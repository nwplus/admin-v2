import { useHackerApplication } from "@/providers/hacker-application-provider";
import { useRef } from "react";
import { HackerAppSection } from "./hacker-app-section";

const sections = [
  { id: "Welcome", title: "Welcome", description: "Welcome the hackers!" },
  { id: "BasicInfo", title: "Basics", description: "Basic hacker information" },
  { id: "Skills", title: "Skills", description: "Skill and contribution questions" },
  { id: "Questionnaire", title: "Questionnaire", description: "For waiver and statistics" },
] as const;

export function HackerAppMain() {
  const { basicInfo, welcome, skills, questionnaire, metadata } = useHackerApplication();
  const containerRef = useRef<HTMLDivElement>(null);

  const sectionData = {
    Welcome: welcome,
    BasicInfo: basicInfo,
    Skills: skills,
    Questionnaire: questionnaire,
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-3 overflow-auto">
      {sections.map(({ id, title, description }) => (
        <HackerAppSection
          key={id}
          section={id}
          title={title}
          description={description}
          data={sectionData[id]}
          metadata={metadata?.[id]}
        />
      ))}
    </div>
  );
}
