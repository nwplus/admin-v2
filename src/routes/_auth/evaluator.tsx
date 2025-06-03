import { ApplicantList } from "@/components/features/evaluator/applicant-list";
import { ApplicantResponse } from "@/components/features/evaluator/applicant-response";
import { ApplicantScoring } from "@/components/features/evaluator/applicant-scoring";
import { PageHeader } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import EvaluatorProvider, { useEvaluator } from "@/providers/evaluator-provider";
import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";

export const Route = createFileRoute("/_auth/evaluator")({
  component: Evaluator,
});

function Evaluator() {
  return (
    <EvaluatorProvider>
      <div className="flex h-full w-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <TooltipProvider>
            <PageHeader className="flex items-center gap-3">
              Evaluator <ActiveHackathonBadge />
            </PageHeader>
          </TooltipProvider>
        </div>
        <div className="relative grid grid-cols-[1fr_2fr_1fr] gap-4">
          <ApplicantList />
          <ApplicantResponse />
          <ApplicantScoring />
        </div>
      </div>
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
        <TooltipContent>Active hackathon is from the InternalWebsites collection</TooltipContent>
      </Tooltip>
    )
  );
};
