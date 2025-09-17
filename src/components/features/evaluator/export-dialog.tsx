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
import { exportApplicantsAsCSV } from "@/services/evaluator";
import { FileDownIcon } from "lucide-react";
import { useState } from "react";
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
                () => exportApplicantsAsCSV(applicants, hackathon),
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
