import type {
  HackerApplicationQuestionFormInputField,
  HackerApplicationSections,
} from "@/lib/firebase/types";

export const SECTIONS = [
  { id: "Welcome", title: "Welcome", description: "Welcome the hackers!" },
  { id: "BasicInfo", title: "Basics", description: "Basic hacker information" },
  { id: "Skills", title: "Skills", description: "Skill and contribution questions" },
  { id: "Questionnaire", title: "Questionnaire", description: "For waiver and statistics" },
] as const satisfies ReadonlyArray<{
  id: HackerApplicationSections;
  title: string;
  description: string;
}>;

export const SECTION_ORDER: readonly HackerApplicationSections[] = SECTIONS.map(({ id }) => id);

export const LEGAL_NAME_FORM_INPUTS: readonly HackerApplicationQuestionFormInputField[] = [
  "legalFirstName",
  "legalLastName",
];
