import { ApplicantList } from "@/components/features/evaluator/applicant-list";
import { ApplicantResponse } from "@/components/features/evaluator/applicant-response";
import { ApplicantScoring } from "@/components/features/evaluator/applicant-scoring";
import { SettingsDialog } from "@/components/features/evaluator/settings-dialog";
import { PageHeader } from "@/components/graphy/typo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { subscribeToHackathons } from "@/lib/firebase/firestore";
import type { Hackathon } from "@/lib/firebase/types";
import EvaluatorProvider, { useEvaluator } from "@/providers/evaluator-provider";
import { createFileRoute } from "@tanstack/react-router";
import { Info, Settings } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_auth/evaluator")({
  component: Evaluator,
});

function Evaluator() {
  const [open, setOpen] = useState<boolean>(false);
  const [hackathonIds, setHackathonIds] = useState<string[]>([]);

  useEffect(() => {
    const unsubHackathons = subscribeToHackathons((hackathons: Hackathon[]) => {
      setHackathonIds(hackathons?.map((h) => h._id));
    });
    return () => unsubHackathons();
  }, []);

  return (
    <EvaluatorProvider>
      <div className="flex h-full w-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <TooltipProvider>
            <PageHeader className="flex items-center gap-3">
              Evaluator <ActiveHackathonBadge />
            </PageHeader>
          </TooltipProvider>
          <div>
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Settings />
              Settings
            </Button>
          </div>
        </div>
        <div className="relative grid grid-cols-[1fr_2fr_1fr] gap-4">
          <ApplicantList />
          <ApplicantResponse />
          <ApplicantScoring />
        </div>
      </div>
      <SettingsDialog open={open} onClose={() => setOpen(false)} hackathonIds={hackathonIds} />
    </EvaluatorProvider>
  );
}

const ActiveHackathonBadge = () => {
  const { hackathon } = useEvaluator();

  return (
    hackathon && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary">
            {hackathon}
            <Info className="opacity-40" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent>Changeable in settings</TooltipContent>
      </Tooltip>
    )
  );
};
