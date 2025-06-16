import { PageHeader } from "@/components/graphy/typo";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useCallback, useMemo, useState } from "react";
import { QueryFilters } from "@/components/features/query/query-filters";
import { QueryTable } from "@/components/features/query/query-table";
import { Download, FileBarChart } from "lucide-react";
import { getAvailableColumns } from "@/services/query";
import { QueryProvider, useQuery } from "@/providers/query-provider";
import { ApplicantProvider, useApplicant } from "@/providers/applicant-provider";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { FlattenedApplicant } from "@/services/query";

export const Route = createFileRoute("/_auth/query")({
  component: QueryPage,
});

function QueryContent() {
  const { hackathons, selectedHackathon, setSelectedHackathon, applicants } = useApplicant();
  const availableColumns = useMemo(() => getAvailableColumns(), []);
  const { tableData } = useQuery();
  const [winner, setWinner] = useState<FlattenedApplicant | null>(null);

  /**
   * Exports the table data to a CSV file.
   */
  const handleExport = useCallback(() => {
    if (tableData.length === 0) {
      return;
    }
    
    const headers = Object.keys(tableData[0]);
    const csvContent = [
      headers.join(","),
      ...tableData.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedHackathon}_applicants_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [tableData, selectedHackathon]);

  /**
   * Selects a random accepted, attending applicant for the raffle and displays an alert.
   */
  const handleRaffle = useCallback(() => {
    if (tableData.length === 0) {
      toast.error("No applicants available for raffle");
      return;
    }
    
    const eligibleApplicants = tableData.filter(applicant => 
      applicant.applicationStatus === "acceptedAndAttending"
    );
    
    if (eligibleApplicants.length === 0) {
      toast.error("No eligible applicants (marked as acceptedAndAttending) for raffle");
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * eligibleApplicants.length);
    setWinner(eligibleApplicants[randomIndex]);
  }, [tableData]);

  return (
    <div className="max-w-full space-y-4 overflow-hidden sm:space-y-6">
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="max-w-full overflow-x-scroll">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <HackathonSelector
                hackathons={hackathons}
                selectedHackathon={selectedHackathon}
                setSelectedHackathon={setSelectedHackathon}
                applicantsCount={applicants.length}
              />
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                {selectedHackathon && (
                  <Button 
                    variant="default" 
                    className="w-full bg-slate-700 hover:bg-slate-800 sm:w-auto"
                    onClick={handleRaffle}
                    disabled={applicants.length === 0}
                    size="sm"
                  >
                    <FileBarChart className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{selectedHackathon} Raffle</span>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={handleExport}
                  disabled={applicants.length === 0}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4 flex-shrink-0" />
                  Export
                </Button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <QueryFilters
                availableColumns={availableColumns}
                tableData={tableData}
              />
              <div className="w-full overflow-hidden">
                <QueryTable />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
      <Dialog open={!!winner} onOpenChange={() => setWinner(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 Raffle Winner!</DialogTitle>
            <DialogDescription>
              {winner && (
                <div>
                  <div>
                    <strong>{winner.firstName} {winner.lastName}</strong>
                  </div>
                  <div>{winner.email}</div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Dropdown to select a hackathon.
 */
function HackathonSelector({
  hackathons,
  selectedHackathon,
  setSelectedHackathon,
  applicantsCount,
}: {
  hackathons: { _id: string }[];
  selectedHackathon: string;
  setSelectedHackathon: (id: string) => void;
  applicantsCount: number;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 items-center gap-2">
        <Select value={selectedHackathon} onValueChange={setSelectedHackathon}>
          <SelectTrigger className="h-auto w-auto border-none p-0 shadow-none">
            <span
              className="max-w-[200px] truncate font-semibold text-lg sm:text-xl"
              title={selectedHackathon || "Select Hackathon"}
            >
              {selectedHackathon || "Select Hackathon"}
            </span>
          </SelectTrigger>
          <SelectContent align="start">
            {hackathons.length === 0 ? (
              <SelectItem value="none" disabled>
                No hackathons available
              </SelectItem>
            ) : (
              hackathons.map((hackathon) => (
                <SelectItem key={hackathon._id} value={hackathon._id}>
                  {hackathon._id}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      {selectedHackathon && (
        <div className="text-gray-500 text-xs">{applicantsCount} Applicants</div>
      )}
    </div>
  );
}

function QueryPage() {
  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <PageHeader className="flex items-center gap-3">Query</PageHeader>
      </div>
      <div className="flex-1">
        <ApplicantProvider>
          <QueryProvider>
            <QueryContent />
          </QueryProvider>
        </ApplicantProvider>
      </div>
    </div>
  );
}
