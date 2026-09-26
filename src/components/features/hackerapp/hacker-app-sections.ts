import type {
  HackerApplicationQuestionFormInputField,
  HackerApplicationQuestionType,
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

// answers live at <section>.<formInput>, so the section a field sits in matters
const SECTION_BY_FORM_INPUT: Partial<
  Record<HackerApplicationQuestionFormInputField, HackerApplicationSections>
> = {
  academicYear: "BasicInfo",
  ageByHackathon: "BasicInfo",
  canadianStatus: "BasicInfo",
  culturalBackground: "BasicInfo",
  dietaryRestriction: "BasicInfo",
  disability: "BasicInfo",
  educationLevel: "BasicInfo",
  email: "BasicInfo",
  gender: "BasicInfo",
  graduation: "BasicInfo",
  haveTransExperience: "BasicInfo",
  identifyAsUnderrepresented: "BasicInfo",
  indigenousIdentification: "BasicInfo",
  // portal's type says skills but everything actually reads basicInfo
  jobPosition: "BasicInfo",
  legalFirstName: "BasicInfo",
  legalLastName: "BasicInfo",
  parentOrGuardianPhoneNumber: "BasicInfo",
  phoneNumber: "BasicInfo",
  phoneNumberOwnerNameAndRelationship: "BasicInfo",
  preferredName: "BasicInfo",
  travellingToHackathon: "BasicInfo",

  contributionRole: "Skills",
  numHackathonsAttended: "Skills",
  longAnswers1: "Skills",
  longAnswers2: "Skills",
  longAnswers3: "Skills",
  longAnswers4: "Skills",
  longAnswers5: "Skills",
  longAnswers6: "Skills",

  engagementSource: "Questionnaire",
  eventsAttended: "Questionnaire",
  friendEmail: "Questionnaire",
};

export const isFormInputAllowedInSection = (
  formInput: HackerApplicationQuestionFormInputField,
  section: HackerApplicationSections,
): boolean => {
  const pinned = SECTION_BY_FORM_INPUT[formInput];
  return pinned === undefined || pinned === section;
};

export const QUESTION_TYPE_SECTION: Partial<
  Record<HackerApplicationQuestionType, HackerApplicationSections>
> = {
  Portfolio: "Skills",
  Github: "Skills",
  LinkedIn: "Skills",
  "Portfolio Website": "Skills",
  Resume: "Skills",
};

export const isQuestionTypeAllowedInSection = (
  questionType: HackerApplicationQuestionType,
  section: HackerApplicationSections,
): boolean => {
  const pinned = QUESTION_TYPE_SECTION[questionType];
  return pinned === undefined || pinned === section;
};
