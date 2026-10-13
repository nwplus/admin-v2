import type { MultiSelectOption } from "@/components/ui/multi-select";

/**
 * ====================================================================
 *
 * TODO: These constants below could be dynamically fetched
 *  from the Firestore. After implementing fetch, move these types
 *  to /lib/firebase/types.ts
 *
 * ====================================================================
 */

export const RESPONSE_VISIBLE_FIELDS = [
  { field: "skills.contributionRole", type: "booleanMap", label: "Role" },
  { field: "basicInfo.educationLevel", type: "short", label: "Year Level" },
  { field: "skills.numHackathonsAttended", type: "short", label: "Number of Hackathons Attended" },
  {
    field: "basicInfo.identifyAsUnderrepresented",
    type: "short",
    label: "Identify as underrepresented",
  },
  {
    field: "skills.longAnswers1",
    type: "long",
    label: "Long Answer 1",
    scoreName: "ResponseOneScore",
  },
  {
    field: "skills.longAnswers2",
    type: "long",
    label: "Long Answer 2",
    scoreName: "ResponseTwoScore",
  },
  {
    field: "skills.longAnswers3",
    type: "long",
    label: "Long Answer 3",
    scoreName: "ResponseThreeScore",
  },
  {
    field: "skills.longAnswers4",
    type: "long",
    label: "Long Answer 4",
    scoreName: "ResponseFourScore",
  },
  {
    field: "skills.longAnswers5",
    type: "long",
    label: "Long Answer 5",
    scoreName: "ResponseFiveScore",
  },
  {
    field: "skills.longAnswers6",
    type: "long",
    label: "Long Answer 6",
    scoreName: "ResponseSixScore",
  },
  { field: "skills.portfolio", type: "link", label: "Portfolio" },
  { field: "skills.github", type: "link", label: "GitHub" },
  { field: "skills.linkedin", type: "link", label: "LinkedIn" },
  { field: "skills.resume", type: "resume", label: "Resume", scoreName: "ResumeScore" },
];

export const CONTRIBUTION_ROLE_OPTIONS: MultiSelectOption[] = [
  {
    label: "Designer",
    value: "designer",
  },
  {
    label: "Developer",
    value: "developer",
  },
  {
    label: "Product Manager",
    value: "productManager",
  },
  {
    label: "Other",
    value: "other",
  },
];
