import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Download, FileBarChart, MoreVertical } from "lucide-react";
import type { FlattenedApplicant } from "@/services/query";
import { useQuery } from "@/providers/query-provider";

/**
 * Dropdown menu combining Export and Raffle actions
 */
export function QueryActions() {
  const { selectedHackathon, tableData } = useQuery();
  const [winner, setWinner] = useState<FlattenedApplicant | null>(null);

  const handleExport = useCallback(() => {
    if (tableData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(tableData[0]);
    const csvContent = [
      headers.join(","),
      ...tableData.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${selectedHackathon}_applicants_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV file downloaded successfully");
  }, [tableData, selectedHackathon]);

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

  const hasData = tableData.length > 0;
  const eligibleForRaffle = hasData && tableData.some(
    (applicant) => applicant.applicationStatus === "acceptedAndAttending"
  );

  return (
    <>
      <TooltipProvider>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none">
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                  <span className="sr-only">More actions</span>
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white border-gray-800">
              <p>Actions</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={handleExport}
              disabled={!hasData}
              className="cursor-pointer p-2"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleRaffle}
              disabled={!eligibleForRaffle}
              className="cursor-pointer p-2"
            >
              <FileBarChart className="mr-2 h-4 w-4" />
              Run Raffle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>

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