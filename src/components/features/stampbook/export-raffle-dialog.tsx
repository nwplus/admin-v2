import { StampPicker } from "@/components/features/stampbook/stamp-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeToHackathons } from "@/lib/firebase/firestore";
import type { Hackathon, HackerStampEntry, Stamp } from "@/lib/firebase/types";
import { downloadCSV, obfuscateEmail } from "@/lib/utils";
import { fetchHackersWithStamps } from "@/services/stamps";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ExportRaffleDialogProps {
  open: boolean;
  onClose: () => void;
  stamps: Stamp[];
}

function generateRaffleCSV(entries: { displayName: string; obfuscatedEmail: string }[]): string {
  return entries.map((entry) => `${entry.displayName} (${entry.obfuscatedEmail})`).join("\n");
}

export function ExportRaffleDialog({ open, onClose, stamps }: ExportRaffleDialogProps) {
  const [selectedHackathon, setSelectedHackathon] = useState<string>("");
  const [selectedStampIds, setSelectedStampIds] = useState<string[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToHackathons(setHackathons);
    return () => unsub();
  }, []);

  const handleHackathonChange = (hackathon: string) => {
    setSelectedHackathon(hackathon);
    setSelectedStampIds([]);
  };

  const handleExport = async () => {
    if (selectedStampIds.length === 0) {
      toast.error("Please select at least one stamp");
      return;
    }

    setLoading(true);
    try {
      const allUserStamps = await fetchHackersWithStamps(selectedHackathon);
      const filteredEntries = allUserStamps.filter((entry: HackerStampEntry) =>
        selectedStampIds.includes(entry.stampId),
      );

      const raffleEntries = filteredEntries.map((entry: HackerStampEntry) => ({
        displayName: entry.displayName,
        obfuscatedEmail: obfuscateEmail(entry.email),
      }));

      if (raffleEntries.length === 0) {
        toast.error("No users found with the selected stamps");
        return;
      }

      const csvContent = generateRaffleCSV(raffleEntries);
      const filename = `stamp-holders-${selectedHackathon}-${new Date().toISOString().split("T")[0]}.csv`;
      downloadCSV(csvContent, filename);
      toast.success(`Exported ${raffleEntries.length} stamp holder rows`);
    } catch (error) {
      console.error("Error exporting stamp holders:", error);
      toast.error("Failed to export stamp holders");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedHackathon("");
    setSelectedStampIds([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(state) => !state && handleClose()}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        aria-describedby="raffle-export-description"
      >
        <DialogHeader>
          <DialogTitle>Export stamp holders</DialogTitle>
          <DialogDescription id="raffle-export-description" className="text-xs">
            Export a CSV of obfuscated emails with one row per collected stamp, so a hacker appears
            once for each selected stamp they hold. This is not the raffle pool, which is based on
            points.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <span className="font-medium text-sm">Hackathon</span>
            <Select value={selectedHackathon} onValueChange={handleHackathonChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a hackathon..." />
              </SelectTrigger>
              <SelectContent>
                {hackathons.map((h) => (
                  <SelectItem key={h._id} value={h._id}>
                    {h._id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedHackathon && (
            <StampPicker
              key={selectedHackathon}
              stamps={stamps}
              hackathon={selectedHackathon}
              selectedIds={selectedStampIds}
              onChange={setSelectedStampIds}
            />
          )}

          <Button
            onClick={handleExport}
            disabled={loading || !selectedHackathon || selectedStampIds.length === 0}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export stamp holders CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
