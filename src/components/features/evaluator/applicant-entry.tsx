import { Button } from "@/components/ui/button";
import type { Applicant } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { ApplicantStatus } from "./applicant-status";

interface ApplicantEntryProps {
  index: number;
  id: string;
  score: Applicant["score"];
  status: Applicant["status"];
  isActive: boolean;
  onSelect: () => void;
}

export function ApplicantEntry({ index, score, status, isActive, onSelect }: ApplicantEntryProps) {
  const normalizedScore = useMemo(() => {
    if (!score?.scores) return 0;
    let total = 0;
    for (const [, scoreData] of Object.entries(score.scores)) {
      if (scoreData?.normalizedScore && typeof scoreData.normalizedScore === "number") {
        total += scoreData.normalizedScore;
      }
    }
    return Math.round(total * 100) / 100;
  }, [score?.scores]);

  return (
    <Button
      onClick={onSelect}
      variant="ghost"
      className={cn(
        "h-full w-full cursor-pointer flex-row justify-between gap-0 rounded-none active:scale-[0.99] active:rounded-md",
        isActive
          ? "bg-theme/10 hover:bg-theme/15 active:bg-theme/15"
          : "hover:bg-theme/5 active:bg-theme/15",
      )}
    >
      <div className="flex flex-col items-start gap-0.5">
        <div>Applicant {index}</div>
        <div className="font-medium">
          Score: {score?.totalScore ?? 0} / Normalized: {normalizedScore}
        </div>
      </div>
      {status?.applicationStatus && <ApplicantStatus status={status?.applicationStatus} />}
    </Button>
  );
}
