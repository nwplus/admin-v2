import { Button } from "@/components/ui/button";
import type { Applicant } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";
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
          Score: {score?.totalScore ?? 0} / Normalized: {score?.totalZScore ?? "-"}
        </div>
      </div>
      {status?.applicationStatus && <ApplicantStatus status={status?.applicationStatus} />}
    </Button>
  );
}
