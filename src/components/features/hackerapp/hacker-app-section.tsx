import { Card } from "@/components/ui/card";
import type { HackerApplicationQuestion, HackerApplicationSections } from "@/lib/firebase/types";

interface HackerAppSectionProps {
  title: string;
  data: HackerApplicationQuestion[];
}

export function HackerAppSection({ title, data }: HackerAppSectionProps) {
  return (
    <Card className="rounded-xl">
      <div className="font-bold text-2xl text-theme">{title}</div>
      {title} {JSON.stringify(data)}
    </Card>
  );
}
