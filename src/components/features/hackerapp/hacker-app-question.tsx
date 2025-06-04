import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
  HackerApplicationQuestion,
  HackerApplicationQuestionFormInputField,
  HackerApplicationQuestionType,
} from "@/lib/firebase/types";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

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
];
// TODO: reorganize type and form input type?
const FORM_INPUT_OPTIONS: HackerApplicationQuestionFormInputField[] = [
  "academicYear",
  "ageByHackathon",
  "canadianStatus",
  "culturalBackground",
  "dietaryRestriction",
  "disability",
  "educationLevel",
  "email",
  "gender",
  "graduation",
  "haveTransExperience",
  "identifyAsUnderrepresented",
  "indigenousIdentification",
  "phoneNumber",
  "preferredName",
  "pronouns",
  "race",
  "jobPosition",
];

const SHOW_FORM_INPUT: HackerApplicationQuestionType[] = [
  "Multiple Choice",
  "Select All",
  "Dropdown",
  "Short Answer",
  "Long Answer",
];
const SHOW_OPTIONS: HackerApplicationQuestionType[] = ["Multiple Choice", "Select All", "Dropdown"];
const SHOW_MAX_CHAR: HackerApplicationQuestionType[] = ["Long Answer"];

interface HackerAppQuestionProps {
  isContent?: boolean;
  question: HackerApplicationQuestion;
}

export function HackerAppQuestion({ isContent, question }: HackerAppQuestionProps) {
  return !isContent ? (
    <div className="flex flex-col gap-5 rounded-tl-xs rounded-tr-xl rounded-br-xl rounded-bl-xs border-theme/70 border-l-4 bg-theme/1 px-3 py-3">
      {/* static */}
      <div className="flex flex-row items-center justify-between">
        <div className={cn("font-bold text-xl", !question?.title ? "italic opacity-40" : "")}>
          {question?.title ?? "Untitled question"}
        </div>
        <Field className="flex-row">
          <Switch checked={question.required} />
          <Label>Required</Label>
        </Field>
      </div>
      <Field>
        <Label>Question</Label>
        <Input value={question.title} />
      </Field>
      <Field>
        <Label>Description (optional)</Label>
        <Textarea value={question.description} placeholder="Description" />
      </Field>
      <Field>
        <Label>Question type</Label>
        <Select onValueChange={() => {}} defaultValue={question.type}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES?.map((q) => (
              <SelectItem key={q} value={q}>
                {q}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* type-dependant */}
      {question?.type && (
        <>
          {SHOW_FORM_INPUT.includes(question.type) && (
            <Field>
              <Label>Form input field</Label>
              <Select onValueChange={() => {}} defaultValue={question.formInput}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {FORM_INPUT_OPTIONS?.map((q) => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
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
                  <div key={`${o}_${i + 1}`}>
                    <Input value={o} placeholder="Option" />
                  </div>
                ))}
                <Field className="flex-row">
                  <Switch checked={question.other} />
                  <Label>Allow other?</Label>
                </Field>
              </div>
            </Field>
          )}

          {/* long ans */}
          {SHOW_MAX_CHAR?.includes(question.type) && (
            <Field>
              <Label>Maximum words</Label>
              <Input value={question.maxWords} />
            </Field>
          )}
        </>
      )}
    </div>
  ) : (
    <div>
      <Field>
        <Label>Header</Label>
        <Input value={question.title} />
      </Field>
      Markdown editor
    </div>
  );
}

const Field = ({ className, children, ...props }: { className?: string; children: ReactNode }) => (
  <div className={cn("flex flex-col gap-2", className)} {...props}>
    {children}
  </div>
);
