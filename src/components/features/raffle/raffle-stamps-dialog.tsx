import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Stamp } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";
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
  const [stampSearch, setStampSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  // load from saved settings so in-progress selection works still
  useEffect(() => {
    if (open) {
      setSelectedStampIds(eligibleStampIds);
      setStampSearch("");
    }
  }, [open, eligibleStampIds]);

  const hackathonStamps = stamps.filter((stamp) => stamp.hackathon === hackathon);
  const filteredStamps = hackathonStamps.filter(
    (stamp) => stamp._id && stamp.name.toLowerCase().includes(stampSearch.toLowerCase()),
  );

  const handleToggleStamp = (stampId: string) => {
    setSelectedStampIds((prev) =>
      prev.includes(stampId) ? prev.filter((id) => id !== stampId) : [...prev, stampId],
    );
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredStamps.map((s) => s._id).filter(Boolean) as string[];
    const allSelected = allFilteredIds.every((id) => selectedStampIds.includes(id));
    setSelectedStampIds(allSelected ? [] : allFilteredIds);
  };

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
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Stamps for {hackathon}</span>
            {filteredStamps.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-auto px-2 py-1 text-xs"
              >
                {filteredStamps.every((s) => selectedStampIds.includes(s._id || ""))
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            )}
          </div>
          <Input
            placeholder="Search stamps..."
            value={stampSearch}
            onChange={(e) => setStampSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto rounded-md border p-2">
            {filteredStamps.length === 0 ? (
              <p className="py-2 text-center text-muted-foreground text-sm">
                No stamps found for this hackathon
              </p>
            ) : (
              <div className="space-y-1">
                {filteredStamps.map((stamp) => (
                  <label
                    key={stamp._id}
                    htmlFor={`raffle-stamp-${stamp._id}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-muted/50",
                      selectedStampIds.includes(stamp._id || "") && "bg-muted",
                    )}
                  >
                    <Checkbox
                      checked={selectedStampIds.includes(stamp._id || "")}
                      onCheckedChange={() => handleToggleStamp(stamp._id || "")}
                      id={`raffle-stamp-${stamp._id}`}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="font-normal text-sm">{stamp.name}</span>
                      {stamp.description && (
                        <p className="line-clamp-1 text-muted-foreground text-xs">
                          {stamp.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            {selectedStampIds.length} stamp{selectedStampIds.length === 1 ? "" : "s"} selected
          </p>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save eligible stamps
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
