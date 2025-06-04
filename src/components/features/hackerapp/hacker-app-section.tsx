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
  data,
  metadata,
  ...props
}: HackerAppSectionProps) {
  // Saving occurs on this level, so keep a local copy of `data`

  return (
    <div id={section} className="pt-3" {...props}>
      <Card className="rounded-xl shadow-none">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          <CardAction>
            <Button>Save</Button>
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
