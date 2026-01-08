import { StampDialog } from "@/components/features/stampbook/stamp-dialog";
import { StampsTable } from "@/components/features/stampbook/stamps-table";
import { PageHeader } from "@/components/graphy/typo";
import { Button } from "@/components/ui/button";
import type { Stamp } from "@/lib/firebase/types";
import { subscribeToStamps } from "@/services/stamps";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_auth/stampbook")({
  component: StampbookPage,
});

function StampbookPage() {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubStamps = subscribeToStamps((stamps: Stamp[]) => {
      setStamps(stamps);
    });

    return () => unsubStamps();
  }, []);

  return (
    <>
      <div className="flex h-full w-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <PageHeader>Stampbook</PageHeader>
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Add Stamp
          </Button>
        </div>
        <StampsTable stamps={stamps} />
      </div>
      <StampDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

