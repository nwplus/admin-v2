import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { Stamp } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";
import { useId, useState } from "react";

interface StampPickerProps {
  stamps: Stamp[];
  hackathon: string;
  selectedIds: string[];
  onChange: (stampIds: string[]) => void;
  label?: string;
}

/**
 * searchable checkbox list of a hackathon's stamps, shared by the raffle and export dialogs
 */
export function StampPicker({
  stamps,
  hackathon,
  selectedIds,
  onChange,
  label = "Stamps",
}: StampPickerProps) {
  const [stampSearch, setStampSearch] = useState<string>("");
  const checkboxId = useId();

  const search = stampSearch.toLowerCase();
  const filteredStamps = stamps.filter(
    (stamp) =>
      stamp.hackathon === hackathon && stamp._id && stamp.name.toLowerCase().includes(search),
  );
  const filteredIds = filteredStamps.map((stamp) => stamp._id).filter(Boolean) as string[];
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

  const handleToggleStamp = (stampId: string) => {
    onChange(
      selectedIds.includes(stampId)
        ? selectedIds.filter((id) => id !== stampId)
        : [...selectedIds, stampId],
    );
  };

  const handleSelectAll = () => {
    onChange(
      allFilteredSelected
        ? selectedIds.filter((id) => !filteredIds.includes(id))
        : [...new Set([...selectedIds, ...filteredIds])],
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{label}</span>
        {filteredStamps.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="h-auto px-2 py-1 text-xs"
          >
            {allFilteredSelected ? "Deselect All" : "Select All"}
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
                htmlFor={`${checkboxId}-${stamp._id}`}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-muted/50",
                  selectedIds.includes(stamp._id || "") && "bg-muted",
                )}
              >
                <Checkbox
                  checked={selectedIds.includes(stamp._id || "")}
                  onCheckedChange={() => handleToggleStamp(stamp._id || "")}
                  id={`${checkboxId}-${stamp._id}`}
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
        {selectedIds.length} stamp{selectedIds.length === 1 ? "" : "s"} selected
      </p>
    </div>
  );
}
