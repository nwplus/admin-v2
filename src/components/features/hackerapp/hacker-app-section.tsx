import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  HackerApplicationMetadataInfo,
  HackerApplicationQuestion,
  HackerApplicationSections,
} from "@/lib/firebase/types";
import { useHackerApplication } from "@/providers/hacker-application-provider";
import { updateHackerAppQuestions } from "@/services/hacker-application";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { HackerAppQuestion, SHOW_FORM_INPUT } from "./hacker-app-question";

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

interface HackerAppSectionProps {
  title: string;
  description: string;
  section: HackerApplicationSections;
  data: HackerApplicationQuestion[];
  metadata: HackerApplicationMetadataInfo;
}

export function HackerAppSection({
  title,
  description,
  section,
  data: initialData,
  metadata,
  ...props
}: HackerAppSectionProps & React.ComponentProps<"div">) {
  const { activeHackathonName } = useHackerApplication();

  // Saving occurs on this level, so keep a local copy of `data`
  const [data, setData] = useState<HackerApplicationQuestion[]>(initialData ?? []);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const isSectionUpdated = useMemo(() => {
    return JSON.stringify(cleanSectionData(data)) !== JSON.stringify(cleanSectionData(initialData)); // rough
  }, [initialData, data]);

  /**
   * Helper that removes a question at a specific index
   * @param index - index of question to remove
   */
  const handleRemoveQuestion = useCallback(
    (index: number) => setData((data) => data.filter((_, i) => i !== index)),
    [],
  );

  /**
   * Helper that adds an empty question after a specific index
   * @param index - index at which to add the question
   */
  const handleAddQuestion = useCallback(
    (index: number) =>
      setData((data) => [...data.slice(0, index + 1), EMPTY_QUESTION, ...data.slice(index + 1)]),
    [],
  );

  /**
   * Helper that moves a question from one index to another
   * @param fromIndex - the current index of the question
   * @param toIndex - the index to move the question to
   */
  const handleMoveQuestion = useCallback(
    (fromIndex: number, toIndex: number) => {
      // uses toIndex in case we want to implement a drag re-ordering UX
      if (toIndex >= 0 && toIndex < data.length && fromIndex !== toIndex) {
        setData((prev) => {
          const newData = [...prev];
          const [movedItem] = newData.splice(fromIndex, 1);
          newData.splice(toIndex, 0, movedItem);
          return newData;
        });
      }
    },
    [data.length],
  );

  /**
   * Helper that updates a question's data
   * @param index - the index of the question
   * @param field - the field of the value to change
   * @param value - the updated value
   */
  const handleChangeQuestionField = useCallback(
    (index: number, field: keyof HackerApplicationQuestion, value: string | boolean | string[]) => {
      setData((data) => {
        const updatedData = [...data];
        updatedData[index] = { ...updatedData[index], [field]: value };
        return updatedData;
      });
    },
    [],
  );

  const handleSave = async () => {
    if (isSaving) return;
    if (!validateSectionData(cleanSectionData(data))) {
      console.log(cleanSectionData(data));
      toast("Please make sure all Form Input values have been selected");
      return;
    }
    setIsSaving(true);
    try {
      await updateHackerAppQuestions(activeHackathonName, section, cleanSectionData(data));
      toast("Application section saved!");
    } catch (error) {
      console.error(error);
      toast("There was an error saving this section");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id={section} className="pt-3" {...props}>
      <Card className="rounded-xl shadow-none">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          <CardAction>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled={!isSectionUpdated || isSaving} onClick={handleSave}>
                  Save
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isSectionUpdated
                  ? "Unsaved changes"
                  : `Last saved ${metadata?.lastEditedAt?.toDate().toLocaleString()}`}
              </TooltipContent>
            </Tooltip>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {data.map((q, i) => (
            <HackerAppQuestion
              key={`${q._id}_${title}`}
              index={i}
              question={q}
              isContent={section === "Welcome"}
              isLast={i === data.length - 1}
              onAdd={handleAddQuestion}
              onMove={handleMoveQuestion}
              onRemove={handleRemoveQuestion}
              onChange={handleChangeQuestionField}
            />
          ))}
          {!data.length && (
            <div className="flex flex-col items-center justify-center">
              <Button variant="outline" onClick={() => handleAddQuestion(0)}>
                <Plus />
                Add Question
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-sm opacity-60">
            Last saved at {metadata?.lastEditedAt?.toDate().toLocaleString()} by{" "}
            {metadata?.lastEditedBy}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
