import type { HackerApplicationQuestion, HackerApplicationSections } from "@/lib/firebase/types";
import { useHackerApplication } from "@/providers/hacker-application-provider";
import { updateHackerAppSectionQuestions } from "@/services/hacker-application";
import { type SetStateAction, useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { SHOW_FORM_INPUT } from "./hacker-app-question";
import { HackerAppSection } from "./hacker-app-section";

export type HackerApplicationFormQuestions = {
  BasicInfo: HackerApplicationQuestion[];
  Questionnaire: HackerApplicationQuestion[];
  Skills: HackerApplicationQuestion[];
  Welcome: HackerApplicationQuestion[];
};

const sections = [
  { id: "Welcome", title: "Welcome", description: "Welcome the hackers!" },
  { id: "BasicInfo", title: "Basics", description: "Basic hacker information" },
  { id: "Skills", title: "Skills", description: "Skill and contribution questions" },
  { id: "Questionnaire", title: "Questionnaire", description: "For waiver and statistics" },
] as const;

const EMPTY_QUESTION: HackerApplicationQuestion = {
  title: "",
  description: "",
  options: [],
  other: false,
  required: false,
};

/**
 * Helper that removes any empty options on option type questions
 * @param data - the section's questions
 * @returns same data type, but cleaned
 */
const cleanSectionData = (data: HackerApplicationQuestion[]): HackerApplicationQuestion[] => {
  return data.map((question) => {
    if (question.options) {
      return {
        ...question,
        options: question.options.filter((option) => option.trim() !== ""),
      };
    }
    return question;
  });
};

/**
 * Helper that does rough validation
 * @param data - the section's questions
 * @returns true is valid
 */
const validateSectionData = (data: HackerApplicationQuestion[]): boolean => {
  for (const question of data) {
    // Title and type are necessary
    if (!question.title || (!question.type && question.content === undefined)) return false;

    // If the type is of general, then a form field needs to be specified
    if (
      question?.type &&
      SHOW_FORM_INPUT.includes(question?.type) &&
      (!question?.formInput || question?.formInput.trim() === "")
    ) {
      return false;
    }
  }
  return true;
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

  const isSectionUpdated = useCallback(
    (section: HackerApplicationSections) => {
      const dbSection = cleanSectionData(formData[section]);
      const draftSection = cleanSectionData(draft[section]);
      return JSON.stringify(dbSection) !== JSON.stringify(draftSection);
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
        EMPTY_QUESTION,
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
    (
      section: HackerApplicationSections,
      index: number,
      field: keyof HackerApplicationQuestion,
      value: string | boolean | string[],
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

    if (!validateSectionData(cleanSectionData(draft[section]))) {
      console.log(cleanSectionData(draft[section]));
      toast("Please make sure all Form Input values have been selected");
      return;
    }
    setIsSaving(true);
    try {
      await updateHackerAppSectionQuestions(
        activeHackathonName,
        section,
        cleanSectionData(draft[section]),
      );
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
      {sections.map(({ id, title, description }) => (
        <>
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
            onChangeQuestionField={(
              index: number,
              field: keyof HackerApplicationQuestion,
              value: string | boolean | string[],
            ) => handleChangeQuestionField(id, index, field, value)}
            onSave={() => handleSave(id)}
            isSaving={isSaving}
            isSectionUpdated={isSectionUpdated(id)}
          />
        </>
      ))}
    </div>
  );
}
