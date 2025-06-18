import { RewardDialog } from "@/components/features/rewards/reward-dialog";
import { RewardsTable } from "@/components/features/rewards/rewards-table";
import { PageHeader } from "@/components/graphy/typo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HackathonRewards } from "@/lib/firebase/types";
import { useHackathon } from "@/providers/hackathon-provider";
import { subscribeToRewards } from "@/services/rewards";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_auth/hackathons/$hackathonId/rewards")({
  component: RewardsPage,
});

function RewardsPage() {
  const { activeHackathon } = useHackathon();

  const [rewards, setRewards] = useState<HackathonRewards[]>([]);

  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubRewards = subscribeToRewards(activeHackathon, (rewards: HackathonRewards[]) => {
      setRewards(rewards);
    });

    return () => {
      unsubRewards();
    };
  }, [activeHackathon]);

  return (
    <>
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <PageHeader className="flex items-center gap-3">
            Rewards
            <Badge variant="secondary">{activeHackathon}</Badge>
          </PageHeader>
          <Button onClick={() => setOpen(true)}>
            <Plus />
            New reward
          </Button>
        </div>
        <RewardsTable rewards={rewards} />
      </div>
      <RewardDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
