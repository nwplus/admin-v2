import type {
  HackerApplicationFormQuestions,
  HackerApplicationQuestionFormInputField,
  HackerApplicationQuestionType,
  HackerApplicationSections,
} from "@/lib/firebase/types";
import { SECTION_ORDER } from "./hacker-app-sections";

const CONDITION_SOURCE_TYPES: HackerApplicationQuestionType[] = ["Multiple Choice", "Dropdown"];

const UNTITLED = "Untitled question";

const OTHER_OPTION_VALUE = "other";

export type ConditionSource = {
  formInput: HackerApplicationQuestionFormInputField;
  title: string;
  sectionIndex: number;
  questionIndex: number;
  options: string[];
};

export const nonEmptyOptions = (options?: string[]): string[] =>
  (options ?? []).map((option) => option.trim()).filter((option) => option !== "");

export const buildConditionSources = (draft: HackerApplicationFormQuestions): ConditionSource[] => {
  const sources: ConditionSource[] = [];
  const seen = new Set<HackerApplicationQuestionFormInputField>();

  SECTION_ORDER.forEach((section, sectionIndex) => {
    draft[section].forEach((question, questionIndex) => {
      if (
        !question.formInput ||
        !question.type ||
        !CONDITION_SOURCE_TYPES.includes(question.type)
      ) {
        return;
      }

      if (seen.has(question.formInput)) return;
      seen.add(question.formInput);

      const options = nonEmptyOptions(question.options);
      if (!options.length) return;

      // dropdown "other" is free text, nothing to match on
      if (
        question.other &&
        question.type === "Multiple Choice" &&
        !options.includes(OTHER_OPTION_VALUE)
      ) {
        options.push(OTHER_OPTION_VALUE);
      }

      sources.push({
        formInput: question.formInput,
        title: question.title?.trim() || UNTITLED,
        sectionIndex,
        questionIndex,
        options,
      });
    });
  });

  return sources;
};

export const getEligibleSources = (
  sources: ConditionSource[],
  section: HackerApplicationSections,
  questionIndex: number,
): ConditionSource[] => {
  const sectionIndex = SECTION_ORDER.indexOf(section);
  return sources.filter(
    (source) =>
      source.sectionIndex < sectionIndex ||
      (source.sectionIndex === sectionIndex && source.questionIndex < questionIndex),
  );
};
