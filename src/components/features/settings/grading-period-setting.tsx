import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useGradingPeriod } from "@/hooks/use-grading-period";
import { updateGradingPeriod } from "@/services/grading-period";
import { useState } from "react";
import { toast } from "sonner";

export function GradingPeriodSetting({ hackathonId }: { hackathonId: string }) {
  const { enabled, error } = useGradingPeriod(hackathonId);
  const [saving, setSaving] = useState(false);

  const handleChange = async (value: boolean) => {
    if (saving || enabled === null) return;
    setSaving(true);
    try {
      await updateGradingPeriod(hackathonId, value);
      toast.success("Grading period updated");
    } catch (error) {
      console.error("Failed to update grading period:", error);
      toast.error("Failed to update grading period");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-6">
      <div className="space-y-1">
        <Label htmlFor="grading-period">Grading period</Label>
        <p className="text-muted-foreground text-sm">
          Hide evaluator Settings, Accept Hackers, and Calculate Z-Score for {hackathonId}. Changes
          save immediately.
        </p>
        {error && <p role="alert">Unable to load the grading period setting.</p>}
      </div>
      <Switch
        id="grading-period"
        checked={enabled === true}
        disabled={enabled === null || saving}
        onCheckedChange={handleChange}
      />
    </div>
  );
}
