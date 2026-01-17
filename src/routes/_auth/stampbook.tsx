import { ExportRaffleDialog } from "@/components/features/stampbook/export-raffle-dialog";
import { StampDialog } from "@/components/features/stampbook/stamp-dialog";
import { StampsTable } from "@/components/features/stampbook/stamps-table";
import { PageHeader } from "@/components/graphy/typo";
import { Button } from "@/components/ui/button";
import type { Stamp } from "@/lib/firebase/types";
import { subscribeToStamps } from "@/services/stamps";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Plus } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_auth/stampbook")({
  component: StampbookPage,
});

function StampbookPage() {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [exportRaffleOpen, setExportRaffleOpen] = useState<boolean>(false);

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
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setExportRaffleOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Export Raffle
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Stamp
            </Button>
          </div>
        </div>
        <StampsTable stamps={stamps} />
      </div>
      <ExportRaffleDialog 
        open={exportRaffleOpen} 
        onClose={() => setExportRaffleOpen(false)} 
        stamps={stamps}
      />
      <StampDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

