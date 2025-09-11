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
import { Plus } from "lucide-react";
import type { UsedFieldsRegistry } from "./hacker-app-main";
import { HackerAppQuestion } from "./hacker-app-question";

interface HackerAppSectionProps {
  title: string;
  description: string;
  section: HackerApplicationSections;
  data: HackerApplicationQuestion[];
  metadata: HackerApplicationMetadataInfo;
  onRemoveQuestion: (index: number) => void;
  onAddQuestion: (index: number) => void;
  onMoveQuestion: (fromIndex: number, toIndex: number) => void;
  onChangeQuestionField: (
    index: number,
    field: keyof HackerApplicationQuestion,
    value: string | boolean | string[],
  ) => void;
  onSave: () => void;
  isSaving: boolean;
  isSectionUpdated: boolean;
  usedFieldsRegistry: UsedFieldsRegistry;
}

export function HackerAppSection({
  title,
  description,
  section,
  data,
  metadata,
  onRemoveQuestion,
  onAddQuestion,
  onMoveQuestion,
  onChangeQuestionField,
  onSave,
  isSaving,
  isSectionUpdated,
  usedFieldsRegistry,
  ...props
}: HackerAppSectionProps & React.ComponentProps<"div">) {
  return (
    <div id={section} className="pt-3" {...props}>
      <Card className="rounded-xl shadow-none">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          <CardAction>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button disabled={!isSectionUpdated || isSaving} onClick={onSave}>
                  Save
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isSaving
                  ? "Saving..."
                  : isSectionUpdated
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
              onAdd={onAddQuestion}
              onMove={onMoveQuestion}
              onRemove={onRemoveQuestion}
              onChange={onChangeQuestionField}
              usedFieldsRegistry={usedFieldsRegistry}
            />
          ))}
          {!data.length && (
            <div className="flex flex-col items-center justify-center">
              <Button variant="outline" onClick={() => onAddQuestion(0)}>
                <Plus />
                Add question
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
