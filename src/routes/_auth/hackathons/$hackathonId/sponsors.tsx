import { SponsorDialog } from "@/components/features/sponsors/sponsor-dialog";
import { SponsorsTable } from "@/components/features/sponsors/sponsors-table";
import { PageHeader } from "@/components/graphy/typo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HackathonSponsors } from "@/lib/firebase/types";
import { useHackathon } from "@/providers/hackathon-provider";
import { subscribeToSponsors } from "@/services/sponsors";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_auth/hackathons/$hackathonId/sponsors")({
  component: SponsorsComponent,
});

function SponsorsComponent() {
  const { activeHackathon } = useHackathon();

  const [sponsors, setSponsors] = useState<HackathonSponsors[]>([]);
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!activeHackathon) return;

    const unsubQuestions = subscribeToSponsors(activeHackathon, (sponsors: HackathonSponsors[]) => {
      setSponsors(sponsors);
    });

    return () => unsubQuestions();
  }, [activeHackathon]);

  return (
    <>
      <div className="flex h-full w-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <PageHeader className="flex items-center gap-3">
            Sponsors
            <Badge variant="secondary">{activeHackathon}</Badge>
          </PageHeader>
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Add Sponsor
          </Button>
        </div>
        <SponsorsTable sponsors={sponsors} />
      </div>
      <SponsorDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
