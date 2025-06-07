import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const getNestedValue = (obj: any, path: string): string | undefined => {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

/**
 * Helper function for separating the hackathon name and year
 * @param hackathonId - the hackathon document ID to spacify
 * @returns hackathon name and year
 */
export const splitHackathon = (hackathonId: string): [string, string | undefined] => {
  const yearMatch = hackathonId.match(/^(.+?)(\d{4})$/);
  if (yearMatch) {
    const [, hackathon, year] = yearMatch;
    return [hackathon, year];
  }
  return [hackathonId, undefined];
};
