import { StampPicker } from "@/components/features/stampbook/stamp-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Stamp } from "@/lib/firebase/types";
import { saveRaffleSettings } from "@/services/raffle";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RaffleStampsDialogProps {
  open: boolean;
  onClose: () => void;
  hackathon: string;
  stamps: Stamp[];
  eligibleStampIds: string[];
}

export function RaffleStampsDialog({
  open,
  onClose,
  hackathon,
  stamps,
  eligibleStampIds,
}: RaffleStampsDialogProps) {
  const [selectedStampIds, setSelectedStampIds] = useState<string[]>(eligibleStampIds);
  const [loading, setLoading] = useState<boolean>(false);

  // load save stamp when dialog opens
  useEffect(() => {
    if (open) setSelectedStampIds(eligibleStampIds);
  }, [open]);

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await saveRaffleSettings(hackathon, selectedStampIds);
      toast.success(
        `${selectedStampIds.length} stamp${selectedStampIds.length === 1 ? "" : "s"} count as entries`,
      );
      onClose();
    } catch (error) {
      console.error("Error saving raffle settings:", error);
      toast.error("Failed to save eligible stamps");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(state) => !state && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Eligible stamps</DialogTitle>
          <DialogDescription className="text-xs">
            Every one of these stamps a hacker collected counts as one raffle entry, so collecting
            more stamps means better odds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <StampPicker
            key={open ? hackathon : "closed"}
            stamps={stamps}
            hackathon={hackathon}
            selectedIds={selectedStampIds}
            onChange={setSelectedStampIds}
            label={`Stamps for ${hackathon}`}
          />

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save eligible stamps
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
