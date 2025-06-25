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

/**
 * Extracts the key of the first true value from a boolean map object.
 * Useful for single-select fields in form data like ethnicity, gender
 * @param booleanMap - boolean map object to extract the key from
 * @returns the key of the first true value
 */
export const returnTrueKey = (booleanMap: Record<string, boolean> | undefined): string => {
  if (!booleanMap) return '';
  const trueKey = Object.entries(booleanMap).find(([_, value]) => value)?.[0];
  return trueKey || '';
};

/**
 * Creates a comma-separated string from a boolean map object by combining selected keys.
 * Useful for multi-select fields in form data like dietary restrictions, majors
 * @param selection - boolean map object to extract key from
 * @param additionalText - additional text to add to the string
 * @returns a comma-separated string of selected keys
 */
export const createStringFromSelection = (
  selection: Record<string, boolean> | undefined, 
  additionalText = ''
): string => {
  if (!selection) return '';
  
  const trueKeys = Object.entries(selection)
    .filter(([_, value]) => value)
    .map(([key, _]) => key);
  
  if (trueKeys.length === 0) return '';
  if (trueKeys.length === 1) return trueKeys[0];
  
  return trueKeys.join(', ') + (additionalText ? `, ${additionalText}` : '');
};