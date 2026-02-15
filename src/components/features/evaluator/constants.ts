import type { MultiSelectOption } from "@/components/ui/multi-select";
import type { ApplicantEducationLevel } from "@/lib/firebase/types";

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

export const YEAR_LEVEL_OPTIONS: Array<{
  label: ApplicantEducationLevel;
  value: ApplicantEducationLevel;
}> = [
  { label: "Less than Secondary / High School", value: "Less than Secondary / High School" },
  { label: "Secondary / High School", value: "Secondary / High School" },
  {
    label: "Undergraduate University (2 year - community college or similar)",
    value: "Undergraduate University (2 year - community college or similar)",
  },
  { label: "Undergraduate University (3+ years)", value: "Undergraduate University (3+ years)" },
  {
    label: "Graduate University (Masters, Doctoral, Professional, etc.)",
    value: "Graduate University (Masters, Doctoral, Professional, etc.)",
  },
  { label: "Code School / Bootcamp", value: "Code School / Bootcamp" },
  {
    label: "Other Vocational / Trade Program or Apprenticeship",
    value: "Other Vocational / Trade Program or Apprenticeship",
  },
  { label: "Post-Doctorate", value: "Post-Doctorate" },
  { label: "I'm not currently a student", value: "I'm not currently a student" },
  { label: "Prefer not to answer", value: "Prefer not to answer" },
];
