import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAllApplicantResumes } from "@/lib/firebase/storage";
import { useEvaluator } from "@/providers/evaluator-provider";
import { flattenApplicantData } from "@/services/query";
import { FileDownIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export function ExportDialog() {
  const { hackathon, applicants } = useEvaluator();
  const [loading, setLoading] = useState<boolean>(false);

  const handleExport = async (
    operation: () => Promise<void> | void,
    successMessage: string,
    errorMessage: string,
    startMessage?: string,
  ) => {
    if (loading) return;
    setLoading(true);

    try {
      if (startMessage) {
        toast(startMessage);
      }
      await operation();
      toast(successMessage);
    } catch (error) {
      console.error(error);
      toast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCSV = useCallback(() => {
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
          <Button
            variant="default"
            disabled={loading}
            onClick={() =>
              handleExport(
                getCSV,
                "Successfully downloaded CSV",
                "An error occured while downloading CSV",
              )
            }
          >
            Download CSV
          </Button>
          <Button
            variant="default"
            disabled={loading}
            onClick={() =>
              handleExport(
                () => getAllApplicantResumes(applicants, hackathon),
                "Successfully downloaded resumes ZIP file.",
                "An error occurred while downloading resumes",
                "Starting resume download. This may take a few moments...",
              )
            }
          >
            Download resumes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
