import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { FileBarChart } from "lucide-react";
import type { FlattenedApplicant } from "@/services/query";
import { useQuery } from "@/providers/query-provider";

/**
 * Provides a button to randomly select a winner from accepted, attending applicants.
 */
export function Raffle() {
  const { selectedHackathon, tableData } = useQuery();
  const [winner, setWinner] = useState<FlattenedApplicant | null>(null);

  const handleRaffle = useCallback(() => {
    if (tableData.length === 0) {
      toast.error("No applicants available for raffle");
      return;
    }

    const eligibleApplicants = tableData.filter(
      (applicant) => applicant.applicationStatus === "acceptedAndAttending",
    );

    if (eligibleApplicants.length === 0) {
      toast.error("No eligible applicants (marked as acceptedAndAttending) for raffle");
      return;
    }

    const randomIndex = Math.floor(Math.random() * eligibleApplicants.length);
    setWinner(eligibleApplicants[randomIndex]);
  }, [tableData]);

  return (
    <>
      <Button
        variant="default"
        className="w-full bg-slate-700 hover:bg-slate-800 sm:w-auto"
        onClick={handleRaffle}
        disabled={tableData.length === 0}
        size="sm"
      >
        <FileBarChart className="mr-2 h-4 w-4 flex-shrink-0" />
        <span className="truncate">{selectedHackathon} Raffle</span>
      </Button>

      <Dialog open={!!winner} onOpenChange={() => setWinner(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 Raffle Winner!</DialogTitle>
            <DialogDescription>
              {winner && (
                <div>
                  <div>
                    <strong>
                      {winner.firstName} {winner.lastName}
                    </strong>
                  </div>
                  <div>{winner.email}</div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
