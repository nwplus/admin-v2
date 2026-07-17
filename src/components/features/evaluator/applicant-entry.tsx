import { Button } from "@/components/ui/button";
import type { Applicant } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";
import { ApplicantStatus } from "./applicant-status";

interface ApplicantEntryProps {
  index: number;
  id: string;
  score: Applicant["score"];
  status: Applicant["status"];
  isActive: boolean;
  onSelect: () => void;
  /** When true, the entry is visually greyed-out for blacklisted applicants (still clickable). */
  disabled?: boolean;
  /** Optional short reason or note to display when the applicant is blacklisted. */
  blacklistNote?: string | null;
}

export function ApplicantEntry({
  index,
  score,
  status,
  isActive,
  onSelect,
  disabled = false,
  blacklistNote = null,
}: ApplicantEntryProps) {
  return (
    <Button
      onClick={onSelect}
      variant="ghost"
      className={cn(
        "h-full w-full rounded-none px-3 py-2.5",
        disabled
          ? "cursor-pointer opacity-40"
          : cn(
              "cursor-pointer active:scale-[0.99] active:rounded-md",
              isActive
                ? "bg-theme/10 hover:bg-theme/15 active:bg-theme/15"
                : "hover:bg-theme/5 active:bg-theme/15",
            ),
      )}
    >
      <div className="grid w-full grid-cols-[40px_1fr_auto] items-center gap-2">
        <div className="flex items-center justify-center">
          {disabled ? (
            <div
              className="flex shrink-0 items-center justify-center rounded-full bg-destructive/10 p-1.5"
              title={blacklistNote ?? "This applicant is blacklisted"}
              aria-hidden={false}
            >
              <ShieldAlert className="size-4 text-destructive" />
            </div>
          ) : (
            <div className="w-10" />
          )}
        </div>

        <div className="flex flex-col items-start gap-0.5">
          <div className="text-sm">Applicant {index}</div>
          <div className="font-medium text-xs">
            Score: {score?.totalScore ?? 0} / Normalized: {score?.totalZScore ?? "-"}
          </div>
        </div>

        <div className="flex items-center justify-end">
          {status?.applicationStatus && <ApplicantStatus status={status.applicationStatus} />}
        </div>
      </div>
    </Button>
  );
}
