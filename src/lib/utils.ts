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

/**
 * Helper function to check if a string can be convertable to a date
 * @param value - the string to check if is valid
 * @returns boolean
 */
export const isValidISODateString = (value?: string): value is string => {
  if (!value || typeof value !== "string") {
    return false;
  }

  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  if (!isoRegex.test(value)) {
    return false;
  }
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
};
