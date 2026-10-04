import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HackathonSponsors } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";
import { useHackathon } from "@/providers/hackathon-provider";
import { updateHackathonSponsorsOrder } from "@/services/sponsors";
import { GripVertical } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ReorderSponsorsDialogProps {
  open: boolean;
  sponsors: HackathonSponsors[];
  onClose: () => void;
}

export function ReorderSponsorsDialog({ open, sponsors, onClose }: ReorderSponsorsDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reorder sponsors</DialogTitle>
          <DialogDescription>Drag sponsors into the order they should appear in.</DialogDescription>
        </DialogHeader>
        {/* Mounted with the dialog, so every open starts from the current order */}
        <ReorderSponsorsList sponsors={sponsors} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

function ReorderSponsorsList({
  sponsors,
  onClose,
}: Pick<ReorderSponsorsDialogProps, "sponsors" | "onClose">) {
  const { activeHackathon } = useHackathon();
  const [items, setItems] = useState<HackathonSponsors[]>(sponsors);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (dragIndex === null) return;
    e.preventDefault();
    if (dragIndex === index) return;

    const next = [...items];
    next.splice(index, 0, ...next.splice(dragIndex, 1));
    setItems(next);
    setDragIndex(index);
  };

  const onSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await updateHackathonSponsorsOrder(activeHackathon, items);
      toast("Sponsor order successfully saved");
      onClose();
    } catch (error) {
      console.error("Error saving sponsor order", error);
      toast("Something went wrong saving the sponsor order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ol className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
        {items.map((sponsor, index) => (
          <li
            key={sponsor._id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              setDragIndex(index);
            }}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={() => setDragIndex(null)}
            className={cn(
              "flex cursor-grab items-center gap-3 rounded-md border bg-background p-2 text-sm",
              dragIndex === index && "opacity-50",
            )}
          >
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
            <img
              src={sponsor.imgURL}
              draggable={false}
              className="aspect-square w-8 shrink-0 rounded-md bg-theme-light object-contain p-1"
            />
            <span className="flex-1 truncate">{sponsor.name}</span>
            <span className="text-muted-foreground">{sponsor.tier}</span>
          </li>
        ))}
      </ol>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={loading} onClick={onSave}>
          Save order
        </Button>
      </DialogFooter>
    </>
  );
}
