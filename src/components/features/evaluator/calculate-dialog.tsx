import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEvaluator } from "@/providers/evaluator-provider";
import { calculateNormalizedScores } from "@/services/evaluator";
import { useState } from "react";
import { toast } from "sonner";

export function CalculateDialog() {
  const { hackathon } = useEvaluator();
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleCalculate = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await calculateNormalizedScores(hackathon);
      toast("Z-scores successfully calculated.");
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast("An error occured while running normalization.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex-grow">Calculate Z-Score</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm z-score calculation</DialogTitle>
          <DialogDescription>
            A large script is about to run—please ensure that all grading has been completed!
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Button variant="default" disabled={loading} onClick={handleCalculate}>
            {loading ? "Running..." : "Calculate"}
          </Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
