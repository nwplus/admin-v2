import type { Applicant } from "@/lib/firebase/types";

export const BEGINNER_MAX_PREV_HACKATHONS = 1;
export const MAX_RATIO_DEVIATION_POINTS = 5;

export type ExperienceGroup = "beginner" | "experienced";

export interface AcceptanceRatio {
  total?: number;
  beginnerPercentage?: number;
}

export interface AcceptancePlan {
  ids: string[];
  /**
   * `all` accepts everyone, 
   * `top` takes the highest ranked applicants, 
   * `proportional` fills a quota per group
   */
  mode: "all" | "top" | "proportional";
  selected: { beginner: number; experienced: number; total: number };
  target: { beginner: number; experienced: number };
  available: { beginner: number; experienced: number };
  finalBeginnerPercentage: number | null;
  hasOverflow: boolean;
  isUnderfilled: boolean;
  exceedsRatioLimit: boolean;
}

const percentageOf = (count: number, total: number) =>
  total === 0 ? null : Math.round((count / total) * 1000) / 10;

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

/**
 * Works out which of the (already filtered) applicants should be accepted
 * @param applicants applicants that passed the acceptance filters
 * @param ratio optional total and beginner share to select proportionally by
 */
export const planAcceptance = (
  applicants: Applicant[],
  { total, beginnerPercentage }: AcceptanceRatio = {},
): AcceptancePlan => {
  const groups = groupByExperience(applicants);
  const available = { beginner: groups.beginner.length, experienced: groups.experienced.length };

  if (total === undefined) {
    return {
      ids: applicants.map((applicant) => applicant._id),
      mode: "all",
      selected: { ...available, total: applicants.length },
      target: available,
      available,
      finalBeginnerPercentage: percentageOf(available.beginner, applicants.length),
      hasOverflow: false,
      isUnderfilled: false,
      exceedsRatioLimit: false,
    };
  }

  // takes highest ranked applicants if no ratio is specified
  if (beginnerPercentage === undefined) {
    const selection = sortByZScore(applicants).slice(0, total);
    const selected = groupByExperience(selection);
    const counts = {
      beginner: selected.beginner.length,
      experienced: selected.experienced.length,
    };
    return {
      ids: selection.map((applicant) => applicant._id),
      mode: "top",
      selected: { ...counts, total: selection.length },
      target: counts,
      available,
      finalBeginnerPercentage: percentageOf(counts.beginner, selection.length),
      hasOverflow: false,
      isUnderfilled: selection.length < total,
      exceedsRatioLimit: false,
    };
  }

  const target = calculateQuotas(total, beginnerPercentage);
  let takeBeginner = Math.min(target.beginner, available.beginner);
  let takeExperienced = Math.min(target.experienced, available.experienced);

  // spill over unfilled seats
  let unfilled = total - takeBeginner - takeExperienced;
  if (unfilled > 0) {
    const spareBeginner = Math.min(unfilled, available.beginner - takeBeginner);
    takeBeginner += spareBeginner;
    unfilled -= spareBeginner;
    takeExperienced += Math.min(unfilled, available.experienced - takeExperienced);
  }

  const selectedTotal = takeBeginner + takeExperienced;
  const finalBeginnerPercentage = percentageOf(takeBeginner, selectedTotal);
  const hasOverflow = takeBeginner > target.beginner || takeExperienced > target.experienced;

  return {
    ids: [
      ...sortByZScore(groups.beginner).slice(0, takeBeginner),
      ...sortByZScore(groups.experienced).slice(0, takeExperienced),
    ].map((applicant) => applicant._id),
    mode: "proportional",
    selected: { beginner: takeBeginner, experienced: takeExperienced, total: selectedTotal },
    target,
    available,
    finalBeginnerPercentage,
    hasOverflow,
    isUnderfilled: selectedTotal < total,
    exceedsRatioLimit:
      hasOverflow &&
      finalBeginnerPercentage !== null &&
      Math.abs(finalBeginnerPercentage - beginnerPercentage) > MAX_RATIO_DEVIATION_POINTS,
  };
};
