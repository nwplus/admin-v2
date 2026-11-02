import type { Stamp } from "@/lib/firebase/types";

/**
 * A stamp's effective point value, where 1 point is 1 raffle entry
 * @param stamp - the stamp, or just its `points`
 * @returns `points` rounded down when it's a finite number of at least 0, otherwise 1, so a
 *  stamp saved before points existed is worth 1
 */
export const stampPointValue = (stamp: Pick<Stamp, "points">): number => {
  const { points } = stamp;
  if (typeof points !== "number" || !Number.isFinite(points) || points < 0) return 1;
  return Math.floor(points);
};
