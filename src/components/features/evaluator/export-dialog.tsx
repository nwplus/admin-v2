import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAllResumes } from "@/lib/firebase/storage";
import { useEvaluator } from "@/providers/evaluator-provider";
import { flattenApplicantData } from "@/services/query";
import { FileDownIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export function ExportDialog() {
  const { hackathon, applicants } = useEvaluator();
  const [loading, setLoading] = useState<boolean>(false);

  const handleCSVExport = useCallback(() => {
    if (applicants.length === 0) {
      return;
    }

    // Flatten the applicant data for CSV export
    const flattenedData = applicants.map((applicant) => flattenApplicantData(applicant, hackathon));
    const headers = Object.keys(flattenedData[0]);
    const csvContent = [
      headers.join(","),
      ...flattenedData.map((row) =>
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
      `${hackathon}_applicants_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [applicants, hackathon]);

  const handleCSV = () => {
    if (loading) return;
    setLoading(true);
    try {
      handleCSVExport();
      toast("Successfully downloaded CSV.");
    } catch (error) {
      console.error(error);
      toast("An error occured while downloading CSV.");
    } finally {
      setLoading(false);
    }
  };

  const handleResumes = async () => {
    if (loading) return;
    setLoading(true);

    try {
      toast("Starting resume download. This may take a few moments...");
      await getAllResumes(applicants, hackathon);
      toast("Successfully downloaded resumes ZIP file.");
    } catch (error) {
      console.error("Error downloading resumes:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast(`Error downloading resumes: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="outline" aria-label="Export">
          <FileDownIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export applicant data</DialogTitle>
        </DialogHeader>
        <div className="mt-2 flex justify-center gap-4">
          <Button variant="default" disabled={loading} onClick={handleCSV}>
            Download CSV
          </Button>
          <Button variant="default" disabled={loading} onClick={handleResumes}>
            Download resumes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
