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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeToHackathons } from "@/lib/firebase/firestore";
import type { Hackathon, Stamp } from "@/lib/firebase/types";
import { cn, downloadCSV, obfuscateEmail } from "@/lib/utils";
import { fetchHackersWithStamps, type HackerStampEntry } from "@/services/stamps";
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
  const [loading, setLoading] = useState(false);
  const [stampSearch, setStampSearch] = useState<string>("");

  useEffect(() => {
    const unsub = subscribeToHackathons(setHackathons);
    return () => unsub();
  }, []);

  const hackathonStamps = stamps.filter((stamp) => stamp.hackathon === selectedHackathon);
  const filteredStamps = hackathonStamps.filter(
    (stamp) => stamp._id && stamp.name.toLowerCase().includes(stampSearch.toLowerCase())
  );

  const handleHackathonChange = (hackathon: string) => {
    setSelectedHackathon(hackathon);
    setSelectedStampIds([]);
    setStampSearch("");
  };

  const handleToggleStamp = (stampId: string) => {
    setSelectedStampIds((prev) =>
      prev.includes(stampId) ? prev.filter((id) => id !== stampId) : [...prev, stampId]
    );
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredStamps.map((s) => s._id).filter(Boolean) as string[];
    const allSelected = allFilteredIds.every((id) => selectedStampIds.includes(id));
    setSelectedStampIds(allSelected ? [] : allFilteredIds);
  };

  const handleExport = async () => {
    if (selectedStampIds.length === 0) {
      toast.error("Please select at least one stamp");
      return;
    }

    setLoading(true);
    try {
      const allUserStamps = await fetchHackersWithStamps();
      const filteredEntries = allUserStamps.filter((entry: HackerStampEntry) =>
        selectedStampIds.includes(entry.stampId)
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
      const filename = `raffle-${selectedHackathon}-${new Date().toISOString().split("T")[0]}.csv`;
      downloadCSV(csvContent, filename);
      toast.success(`Exported ${raffleEntries.length} raffle entries`);
    } catch (error) {
      console.error("Error exporting raffle:", error);
      toast.error("Failed to export raffle data");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedHackathon("");
    setSelectedStampIds([]);
    setStampSearch("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(state) => !state && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" aria-describedby="raffle-export-description">
        <DialogHeader>
          <DialogTitle>Export Raffle</DialogTitle>
          <DialogDescription id="raffle-export-description" className="text-xs">
            Export a CSV of obfuscated emails for raffles. Outputs a list of name + emails, where duplicate entries correlate to number of stamps collected by a hacker.
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Stamps</span>
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
              <div className="max-h-48 overflow-y-auto rounded-md border p-2">
                {filteredStamps.length === 0 ? (
                  <p className="py-2 text-center text-muted-foreground text-sm">
                    No stamps found for this hackathon
                  </p>
                ) : (
                  <div className="space-y-1">
                    {filteredStamps.map((stamp) => (
                      <label
                        key={stamp._id}
                        htmlFor={`stamp-${stamp._id}`}
                        className={cn(
                          "flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-muted/50",
                          selectedStampIds.includes(stamp._id || "") && "bg-muted"
                        )}
                      >
                        <Checkbox
                          checked={selectedStampIds.includes(stamp._id || "")}
                          onCheckedChange={() => handleToggleStamp(stamp._id || "")}
                          id={`stamp-${stamp._id}`}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <span className="font-normal text-sm">{stamp.name}</span>
                          {stamp.description && (
                            <p className="line-clamp-1 text-muted-foreground text-xs">{stamp.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {selectedStampIds.length > 0 && (
                <p className="text-muted-foreground text-xs">
                  {selectedStampIds.length} stamp{selectedStampIds.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          <Button
            onClick={handleExport}
            disabled={loading || !selectedHackathon || selectedStampIds.length === 0}
            className="w-full"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export Raffle CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
