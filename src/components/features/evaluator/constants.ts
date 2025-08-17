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
  { field: "firstHackathon", type: "short", label: "Is this your first hackathon?" },
  { field: "skills.longAnswers1", type: "long", label: "Long Answer 1" },
  { field: "skills.longAnswers2", type: "long", label: "Long Answer 2" },
  { field: "skills.longAnswers3", type: "long", label: "Long Answer 3" },
  { field: "skills.longAnswers4", type: "long", label: "Long Answer 4" },
  { field: "skills.portfolio", type: "link", label: "Portfolio" },
  { field: "skills.github", type: "link", label: "GitHub" },
  { field: "skills.linkedin", type: "link", label: "LinkedIn" },
  { field: "skills.resume", type: "resume", label: "Resume" },
];

export interface ScoringCriteria {
  label: string;
  field: string;
  minScore: number;
  maxScore: number;
  increments: number;
  weight: number;
}

export const SCORING_CRITERIA: ScoringCriteria[] = [
  {
    label: "Resume",
    field: "ResumeScore",
    minScore: 0,
    maxScore: 5,
    increments: 1,
    weight: 1.0,
  },
  {
    label: "Experience",
    field: "NumExperiences",
    minScore: 0,
    maxScore: 5,
    increments: 1,
    weight: 1.0,
  },
  {
    label: "Response 1 Score",
    field: "ResponseOneScore",
    minScore: -1,
    maxScore: 5,
    increments: 1,
    weight: 1.0,
  },
  {
    label: "Response 2 Score",
    field: "ResponseTwoScore",
    minScore: -1,
    maxScore: 5,
    increments: 1,
    weight: 1.0,
  },
  {
    label: "Response 3 Score",
    field: "ResponseThreeScore",
    minScore: -1,
    maxScore: 5,
    increments: 1,
    weight: 1.0,
  },
  {
    label: "Response 4 Score",
    field: "ResponseFourScore",
    minScore: -1,
    maxScore: 5,
    increments: 1,
    weight: 1.0,
  },
];
