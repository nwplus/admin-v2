import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FORM_INPUT_FIELDS } from "@/lib/firebase/types";
import type {
  HackerApplicationQuestion,
  HackerApplicationQuestionFormInputField,
  HackerApplicationQuestionType,
  HackerApplicationSections,
} from "@/lib/firebase/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Plus, Trash } from "lucide-react";
import { type ReactNode, memo, useEffect } from "react";
import { Editor } from "../editor";
import {
  type ConditionSource,
  conditionValueLabel,
  getConditionIssue,
  getEligibleSources,
} from "./hacker-app-conditions";
import type { UsedFieldsRegistry } from "./hacker-app-main";
import { LEGAL_NAME_FORM_INPUTS, isFormInputAllowedInSection } from "./hacker-app-sections";

const QUESTION_TYPES: HackerApplicationQuestionType[] = [
  "Long Answer",
  "Portfolio",
  "Select All",
  "Multiple Choice",
  "Full Legal Name",
  "Short Answer",
  "Dropdown",
  "School",
  "Major",
  "Country",
  "Github",
  "LinkedIn",
  "Portfolio Website",
  "Resume",
];

// Question types that if selected, bricks the select field and locks in the value
const QUESTION_TYPES_UNIQUE: HackerApplicationQuestionType[] = [
  "Portfolio",
  "Full Legal Name",
  "School",
  "Major",
  "Country",
  "Github",
  "LinkedIn",
  "Portfolio Website",
  "Resume",
];

export const SHOW_FORM_INPUT: HackerApplicationQuestionType[] = [
  "Multiple Choice",
  "Select All",
  "Dropdown",
  "Short Answer",
  "Long Answer",
];
const SHOW_OPTIONS: HackerApplicationQuestionType[] = ["Multiple Choice", "Select All", "Dropdown"];
const SHOW_MAX_CHAR: HackerApplicationQuestionType[] = ["Long Answer"];

interface HackerAppQuestionProps {
  index: number;
  section: HackerApplicationSections;
  question: HackerApplicationQuestion;
  isContent?: boolean;
  isLast?: boolean;
  onAdd: (index: number) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (index: number) => void;
  onChange: <K extends keyof HackerApplicationQuestion>(
    index: number,
    field: K,
    value: HackerApplicationQuestion[K],
  ) => void;
  usedFieldsRegistry: UsedFieldsRegistry;
  conditionSources: ConditionSource[];
}

export const HackerAppQuestion = memo(function HackerAppQuestion({
  index,
  section,
  question,
  isContent,
  isLast = false,
  onAdd,
  onMove,
  onRemove,
  onChange,
  usedFieldsRegistry,
  conditionSources,
}: HackerAppQuestionProps) {
  /**
   * Helper function to properly modify options array before sending it up
   * @param index - the option's index in the question options field
   * @param value - the updated option
   */
  const handleOptionChange = (optionIndex: number, value: string) => {
    onChange(
      index,
      "options",
      (question?.options ?? []).map((opt, i) => (i === optionIndex ? value : opt)),
    );
  };

  useEffect(() => {
    const options = question.options || [];

    // Add empty option if all current option items are filled
    if (options?.length === 0 || options.every((opt) => opt.trim() !== "")) {
      onChange(index, "options", [...options, ""]);
    }

    // Remove extra empty options
    let trimIndex = options.length;
    while (trimIndex > 0 && options[trimIndex - 1].trim() === "") trimIndex--;

    const numEmptyAtEnd = options.length - trimIndex;
    if (numEmptyAtEnd > 1) {
      onChange(index, "options", options.slice(0, -1));
    }
  }, [index, question.options, onChange]);

  const hasSplitLegalName = LEGAL_NAME_FORM_INPUTS.some((field) =>
    usedFieldsRegistry.formInput.has(field),
  );
  const usableQuestionTypes = QUESTION_TYPES?.filter(
    (qt) =>
      (qt !== "Full Legal Name" || !hasSplitLegalName) &&
      (!QUESTION_TYPES_UNIQUE.includes(qt) || !usedFieldsRegistry.questionType.has(qt)),
  );
  const usableFormInputs = FORM_INPUT_FIELDS.filter(
    (fi) => !usedFieldsRegistry.formInput.has(fi) && isFormInputAllowedInSection(fi, section),
  );
  const isQuestionTypeDisabled = Boolean(
    question.type && QUESTION_TYPES_UNIQUE.includes(question.type),
  );
  const isFormInputDisabled = Boolean(question.formInput);

  const condition = question.condition;
  const eligibleSources = getEligibleSources(conditionSources, section, index);
  const conditionSource = eligibleSources.find((s) => s.formInput === condition?.sourceFormInput);
  const conditionIssue = getConditionIssue(question, eligibleSources);
  const conditionValueOptions = [
    ...new Set([...(conditionSource?.options ?? []), ...(condition?.values ?? [])]),
  ];
  const canToggleCondition = eligibleSources.length > 0 || Boolean(condition);

  const handleConditionToggle = (enabled: boolean) => {
    const nearest = eligibleSources.at(-1);
    onChange(
      index,
      "condition",
      enabled && nearest ? { sourceFormInput: nearest.formInput, values: [] } : undefined,
    );
  };

  return !isContent ? (
    <div className="relative flex flex-col gap-3">
      <div className="absolute right-0 flex translate-x-[calc(100%+0.5rem)] flex-col justify-center gap-2">
        {index !== 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => onMove(index, index - 1)}>
                <ChevronUp />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Move question up</TooltipContent>
          </Tooltip>
        )}
        {!isLast && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => onMove(index, index + 1)}>
                <ChevronDown />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Move question down</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Confirm
              variant="outline"
              size="icon"
              className="size-9"
              onConfirm={() => onRemove(index)}
            >
              <Trash className="text-destructive" />
            </Confirm>
          </TooltipTrigger>
          <TooltipContent side="right">Delete question</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex flex-col gap-5 rounded-tl-xs rounded-tr-xl rounded-br-xl rounded-bl-xs border-theme/70 border-l-4 bg-theme/1 px-3 py-3">
        <div className="flex flex-row items-start justify-between gap-2">
          <div className={cn("font-bold text-xl", !question?.title ? "italic opacity-40" : "")}>
            {question?.title ?? "Untitled question"}
          </div>
          <Field className="flex-row">
            <Switch
              checked={question.required}
              onCheckedChange={(s) => onChange(index, "required", s)}
            />
            <Label>Required</Label>
          </Field>
        </div>
        <Field>
          <Label>Question</Label>
          <Input
            className="bg-background"
            value={question.title}
            onChange={(e) => onChange(index, "title", e.target.value)}
          />
        </Field>
        <Field>
          <Label>Description (optional)</Label>
          <Textarea
            value={question.description}
            placeholder="Description"
            className="bg-background"
            onChange={(e) => onChange(index, "description", e.target.value)}
          />
        </Field>
        <Field>
          <Label>Question type</Label>
          <Select
            onValueChange={(v) => {
              if (isQuestionTypeDisabled) return;
              onChange(index, "type", v as HackerApplicationQuestionType);
            }}
            defaultValue={question.type}
            disabled={isQuestionTypeDisabled}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {isQuestionTypeDisabled ? (
                <SelectItem value={question.type as string}>{question.type}</SelectItem>
              ) : (
                usableQuestionTypes?.map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </Field>

        {/* type-dependant */}
        {question?.type && (
          <>
            {/* any generic types */}
            {SHOW_FORM_INPUT.includes(question.type) && (
              <Field>
                <Label>Form input field</Label>
                <Select
                  onValueChange={(v) => {
                    if (isFormInputDisabled) return;
                    onChange(index, "formInput", v as HackerApplicationQuestionFormInputField);
                  }}
                  defaultValue={question.formInput}
                  disabled={isFormInputDisabled}
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {isFormInputDisabled ? (
                      <SelectItem value={question.formInput as string}>
                        {question.formInput}
                      </SelectItem>
                    ) : (
                      usableFormInputs?.map((q) => (
                        <SelectItem key={q} value={q}>
                          {q}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </Field>
            )}

            {/* select single, select all, dropdown */}
            {SHOW_OPTIONS.includes(question.type) && (
              <Field>
                <Label>Options</Label>
                <div className="flex flex-col gap-2 rounded-tl-xs rounded-tr-xl rounded-br-xl rounded-bl-xs border-theme/70 border-l-4 bg-theme/2 px-3 py-3">
                  {question.options?.map((o, i) => (
                    <div key={`${i}_${index}_ideallyWeUseAnId`}>
                      <Input
                        value={o}
                        placeholder="Option"
                        className="bg-background"
                        onChange={(e) => handleOptionChange(i, e.target.value)}
                      />
                    </div>
                  ))}
                  <Field className="flex-row">
                    <Switch
                      checked={question.other}
                      onCheckedChange={(s) => onChange(index, "other", s)}
                    />
                    <Label>Allow other?</Label>
                  </Field>
                </div>
              </Field>
            )}

            {/* long ans */}
            {SHOW_MAX_CHAR?.includes(question.type) && (
              <Field>
                <Label>Maximum words</Label>
                <Input
                  value={question.maxWords}
                  className="bg-background"
                  onChange={(e) => onChange(index, "maxWords", e.target.value)}
                />
              </Field>
            )}
          </>
        )}

        <Field>
          <Tooltip>
            <TooltipTrigger asChild>
              <Field className="flex-row">
                <Switch
                  checked={Boolean(condition)}
                  disabled={!canToggleCondition}
                  onCheckedChange={handleConditionToggle}
                />
                <Label>Only show this question conditionally</Label>
              </Field>
            </TooltipTrigger>
            {!canToggleCondition && (
              <TooltipContent side="right">
                Add a multiple choice or dropdown question before this one first
              </TooltipContent>
            )}
          </Tooltip>

          {condition && (
            <div className="flex flex-col gap-3 rounded-tl-xs rounded-tr-xl rounded-br-xl rounded-bl-xs border-theme/70 border-l-4 bg-theme/2 px-3 py-3">
              <Field>
                <Label>Show when</Label>
                <Select
                  value={conditionSource?.formInput ?? ""}
                  onValueChange={(v) =>
                    onChange(index, "condition", {
                      sourceFormInput: v as HackerApplicationQuestionFormInputField,
                      values: [],
                    })
                  }
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Select a question" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleSources.map((source) => (
                      <SelectItem key={source.formInput} value={source.formInput}>
                        <div className="flex flex-col items-start">
                          <span className="line-clamp-1">{source.title}</span>
                          <span className="text-muted-foreground text-xs">{source.formInput}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <Label>is answered with any of</Label>
                <MultiSelect
                  options={conditionValueOptions.map((o) => ({
                    label: conditionValueLabel(o),
                    value: o,
                  }))}
                  selected={condition.values}
                  onChange={(values) => onChange(index, "condition", { ...condition, values })}
                  placeholder="Select answers..."
                  className="bg-background"
                />
              </Field>
              <div className="text-muted-foreground text-sm">
                Hidden questions are not required, even when Required is on.
              </div>
              {conditionIssue && <div className="text-destructive text-sm">{conditionIssue}</div>}
            </div>
          )}
        </Field>
      </div>

      <div className="flex w-full justify-center">
        <Button variant="outline" onClick={() => onAdd(index)}>
          <Plus />
          Add question
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex flex-col gap-4">
      <Field>
        <Label>Header</Label>
        <Input value={question.title} onChange={(e) => onChange(index, "title", e.target.value)} />
      </Field>
      <Field>
        <Label>Message</Label>
        <Editor
          padding={12}
          initialContent={question?.content}
          onContentChange={(value) => onChange(index, "content", value)}
          placeholder="Your heart-stirring, tear-jerking, shirt-tearing, inspirational message here..."
          className="rounded-md border-1 border-input shadow-xs"
        />
      </Field>
    </div>
  );
});

const Field = ({ className, children, ...props }: { className?: string; children: ReactNode }) => (
  <div className={cn("flex flex-col gap-2", className)} {...props}>
    {children}
  </div>
);
