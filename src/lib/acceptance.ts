import type { Applicant } from "@/lib/firebase/types";

export const BEGINNER_MAX_PREV_HACKATHONS = 1;

export type ExperienceGroup = "beginner" | "experienced";


const getZScore = (applicant: Applicant) => {
  const zScore = applicant.score?.totalZScore;
  return typeof zScore === "number" && !Number.isNaN(zScore) ? zScore : Number.NEGATIVE_INFINITY;
};

/**
 * reads number of prev hackathons from applicant
 */
export const parsePrevHackathons = (numHackathonsAttended?: string) => {
  const parsed = Number.parseInt(String(numHackathonsAttended ?? "").trim(), 10);
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
};

export const getExperienceGroup = (applicant: Applicant): ExperienceGroup =>
  parsePrevHackathons(applicant.skills?.numHackathonsAttended) <= BEGINNER_MAX_PREV_HACKATHONS
    ? "beginner"
    : "experienced";

export const groupByExperience = (
  applicants: Applicant[],
): Record<ExperienceGroup, Applicant[]> => {
  const groups: Record<ExperienceGroup, Applicant[]> = { beginner: [], experienced: [] };
  for (const applicant of applicants) {
    groups[getExperienceGroup(applicant)].push(applicant);
  }
  return groups;
};

/**
 * sorts applicants by z-score, highest first
 */
export const sortByZScore = (applicants: Applicant[]): Applicant[] =>
  applicants.slice().sort((a, b) => {
    const aZScore = getZScore(a);
    const bZScore = getZScore(b);
    if (aZScore !== bZScore) return bZScore - aZScore;
    return a._id.localeCompare(b._id);
  });

/**
 * splits a total into per group quotas
 */
export const calculateQuotas = (total: number, beginnerPercentage: number) => {
  const beginner = Math.min(total, Math.max(0, Math.round((total * beginnerPercentage) / 100)));
  return { beginner, experienced: total - beginner };
};

