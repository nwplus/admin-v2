import type {
  HackerApplicationFormQuestions,
  HackerApplicationQuestion,
  HackerApplicationQuestionFormInputField,
  HackerApplicationQuestionType,
  HackerApplicationSections,
} from "@/lib/firebase/types";
import { useHackerApplication } from "@/providers/hacker-application-provider";
import { updateHackerAppSectionQuestions } from "@/services/hacker-application";
import { type SetStateAction, useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  buildConditionSources,
  findConditionIssues,
  nonEmptyOptions,
} from "./hacker-app-conditions";
import { SHOW_FORM_INPUT } from "./hacker-app-question";
import { HackerAppSection } from "./hacker-app-section";
import { LEGAL_NAME_FORM_INPUTS, SECTIONS } from "./hacker-app-sections";

export type UsedFieldsRegistry = {
  formInput: Set<HackerApplicationQuestionFormInputField>;
  questionType: Set<HackerApplicationQuestionType>;
};

const EMPTY_QUESTION: HackerApplicationQuestion = {
  title: "",
  description: "",
  options: [],
  other: false,
  required: false,
};

/**
 * Helper that removes any empty options on option type questions and normalizes conditions
 * @param data - the section's questions
 * @returns same data type, but cleaned
 */
const cleanSectionData = (data: HackerApplicationQuestion[]): HackerApplicationQuestion[] =>
  data.map((question) => {
    const cleaned = { ...question };

    if (question.options) cleaned.options = nonEmptyOptions(question.options);

    if (question.condition) {
      cleaned.condition = {
        ...question.condition,
        values: [
          ...new Set(question.condition.values.map((value) => value.trim()).filter(Boolean)),
        ],
      };
    }

    return cleaned;
  });

/**
 * Helper that does rough validation
 * @param data - the section's questions
 * @returns why the section can't be saved, or null when it's valid
 */
const validateSectionData = (data: HackerApplicationQuestion[]): string | null => {
  const hasFullLegalName = data.some((question) => question.type === "Full Legal Name");
  const hasSplitLegalName = data.some(
    (question) => question.formInput && LEGAL_NAME_FORM_INPUTS.includes(question.formInput),
  );
  if (hasFullLegalName && hasSplitLegalName) {
    return "A section can't mix Full Legal Name with separate legal name fields";
  }

  for (const [index, question] of data.entries()) {
    // Title and type are necessary
    if (!question.title || (!question.type && question.content === undefined)) {
      return `Question ${index + 1} is missing a title or type`;
    }

    // If the type is of general, then a form field needs to be specified
    if (
      question?.type &&
      SHOW_FORM_INPUT.includes(question?.type) &&
      (!question?.formInput || question?.formInput.trim() === "")
    ) {
      return `"${question.title}" needs a form input field`;
    }

    if (question.condition && !question.condition.values.length) {
      return `"${question.title}" has a condition with no answers selected`;
    }
  }
  return null;
};

export function HackerAppMain() {
  const { activeHackathonName, basicInfo, welcome, skills, questionnaire, metadata } =
    useHackerApplication();
  const containerRef = useRef<HTMLDivElement>(null);

  const formData: HackerApplicationFormQuestions = useMemo(
    () => ({
      Welcome: welcome ?? [],
      BasicInfo: basicInfo ?? [],
      Skills: skills ?? [],
      Questionnaire: questionnaire ?? [],
    }),
    [welcome, basicInfo, skills, questionnaire],
  );

  // Saving occurs on this level, so keep a local copy of the form
  const [draft, setDraft] = useState<HackerApplicationFormQuestions>(formData);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const conditionSources = useMemo(() => buildConditionSources(draft), [draft]);

  const usedFieldsRegistry: UsedFieldsRegistry = useMemo(() => {
    const allQuestions = Object.values(draft).flat() as HackerApplicationQuestion[];

    const allQuestionTypes = allQuestions
      .map((q) => q.type)
      .filter((t): t is HackerApplicationQuestionType => t !== undefined);

    const allFormInputs = allQuestions
      .map((q) => q.formInput)
      .filter((f): f is HackerApplicationQuestionFormInputField => f !== undefined);

    const formInput = new Set(allFormInputs);
    if (allQuestionTypes.includes("Full Legal Name")) {
      for (const field of LEGAL_NAME_FORM_INPUTS) formInput.add(field);
    }

    return {
      questionType: new Set(allQuestionTypes),
      formInput,
    };
  }, [draft]);

  const isSectionUpdated = useMemo(
    () => (section: HackerApplicationSections) => {
      const dbSection = cleanSectionData(formData[section]);
      const draftSection = cleanSectionData(draft[section]);

      // Compare sections without _id fields since they're database-specific
      const dbSectionWithoutIds = dbSection.map(({ _id, ...question }) => question);
      const draftSectionWithoutIds = draftSection.map(({ _id, ...question }) => question);

      return JSON.stringify(dbSectionWithoutIds) !== JSON.stringify(draftSectionWithoutIds);
    },
    [formData, draft],
  );

  /**
   * Helper that mimics a setState function for one specific section's question list
   * @param section - key representing a hacker application section
   * @param updater - a SetStateAction-esque updater that returns the updated question list for the section
   */
  const setSectionQuestions = useCallback(
    (section: HackerApplicationSections, updater: SetStateAction<HackerApplicationQuestion[]>) => {
      setDraft((prev) => ({
        ...prev,
        [section]: typeof updater === "function" ? updater(prev[section]) : updater,
      }));
    },
    [],
  );

  /**
   * Helper that removes a question at a specific index
   * @param index - index of question to remove
   */
  const handleRemoveQuestion = useCallback(
    (section: HackerApplicationSections, index: number) =>
      setSectionQuestions(section, (data) => data.filter((_, i) => i !== index)),
    [setSectionQuestions],
  );

  /**
   * Helper that adds an empty question after a specific index
   * @param section - key for the section being modified
   * @param index - index at which to add the question
   */
  const handleAddQuestion = useCallback(
    (section: HackerApplicationSections, index: number) =>
      setSectionQuestions(section, (data) => [
        ...data.slice(0, index + 1),
        { ...EMPTY_QUESTION, _id: crypto.randomUUID() },
        ...data.slice(index + 1),
      ]),
    [setSectionQuestions],
  );

  /**
   * Helper that moves a question from one index to another
   * @param section - key for the section being modified
   * @param fromIndex - the current index of the question
   * @param toIndex - the index to move the question to
   */
  const handleMoveQuestion = useCallback(
    (section: HackerApplicationSections, fromIndex: number, toIndex: number) => {
      // uses toIndex in case we want to implement a drag re-ordering UX
      if (toIndex >= 0 && toIndex < draft[section].length && fromIndex !== toIndex) {
        setSectionQuestions(section, (prev) => {
          const newData = [...prev];
          const [movedItem] = newData.splice(fromIndex, 1);
          newData.splice(toIndex, 0, movedItem);
          return newData;
        });
      }
    },
    [draft, setSectionQuestions],
  );

  /**
   * Helper that updates a question's data
   * @param section - key for the section being modified
   * @param index - the index of the question
   * @param field - the field of the value to change
   * @param value - the updated value
   */
  const handleChangeQuestionField = useCallback(
    <K extends keyof HackerApplicationQuestion>(
      section: HackerApplicationSections,
      index: number,
      field: K,
      value: HackerApplicationQuestion[K],
    ) => {
      setSectionQuestions(section, (data) => {
        const updatedData = [...data];
        updatedData[index] = { ...updatedData[index], [field]: value };
        return updatedData;
      });
    },
    [setSectionQuestions],
  );

  const handleSave = async (section: HackerApplicationSections) => {
    if (isSaving) return;

    const cleaned = cleanSectionData(draft[section]);

    const error = validateSectionData(cleaned);
    if (error) {
      toast.error(error);
      return;
    }

    const afterSave = { ...formData, [section]: cleaned };
    const [issue] = findConditionIssues(afterSave, buildConditionSources(afterSave));
    if (issue) {
      const where = SECTIONS.find(({ id }) => id === issue.section)?.title ?? issue.section;
      toast.error(`${where} — "${issue.title}": ${issue.detail}`);
      return;
    }

    setIsSaving(true);
    try {
      await updateHackerAppSectionQuestions(activeHackathonName, section, cleaned);
      toast("Application section saved!");
    } catch (error) {
      console.error(error);
      toast("There was an error saving this section");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div ref={containerRef} className="flex w-full flex-col gap-3 ">
      {SECTIONS.map(({ id, title, description }) => (
        <HackerAppSection
          key={id}
          section={id}
          title={title}
          description={description}
          data={draft[id as HackerApplicationSections]}
          metadata={metadata?.[id]}
          onRemoveQuestion={(index: number) => handleRemoveQuestion(id, index)}
          onAddQuestion={(index: number) => handleAddQuestion(id, index)}
          onMoveQuestion={(fromIndex: number, toIndex: number) =>
            handleMoveQuestion(id, fromIndex, toIndex)
          }
          onChangeQuestionField={(index, field, value) =>
            handleChangeQuestionField(id, index, field, value)
          }
          onSave={() => handleSave(id)}
          isSaving={isSaving}
          isSectionUpdated={isSectionUpdated(id)}
          usedFieldsRegistry={usedFieldsRegistry}
          conditionSources={conditionSources}
        />
      ))}
    </div>
  );
}
