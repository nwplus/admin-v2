import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileDownIcon } from "lucide-react";

export function ExportDialog() {
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
          <Button variant="default">Download CSV</Button>
          <Button variant="default">Download resumes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
