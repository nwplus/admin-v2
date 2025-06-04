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
import type {
  HackerApplicationMetadataInfo,
  HackerApplicationQuestion,
  HackerApplicationSections,
} from "@/lib/firebase/types";
import { useMemo, useState } from "react";
import { HackerAppQuestion } from "./hacker-app-question";

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
}: HackerAppSectionProps) {
  // Saving occurs on this level, so keep a local copy of `data`
  const [data, setData] = useState<HackerApplicationQuestion[]>(initialData ?? []);

  const isSectionUpdated = useMemo(() => {
    return JSON.stringify(data) !== JSON.stringify(initialData); // rough
  }, [initialData, data]);

  const handleChangeField = (
    index: number,
    field: keyof HackerApplicationQuestion,
    value: string,
  ) => {
    const updatedData = [...data];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setData(updatedData);
  };

  return (
    <div id={section} className="pt-3" {...props}>
      <Card className="rounded-xl shadow-none">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          <CardAction>
            <Button disabled={!isSectionUpdated}>Save</Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {data?.map((q) => (
            <HackerAppQuestion
              key={`${q._id}_${title}`}
              isContent={section === "Welcome"}
              question={q}
            />
          ))}
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
