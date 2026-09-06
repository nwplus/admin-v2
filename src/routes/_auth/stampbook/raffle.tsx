import { RaffleDrawPanel } from "@/components/features/raffle/raffle-draw-panel";
import { RafflePrizesCard } from "@/components/features/raffle/raffle-prizes-card";
import { RaffleStampsDialog } from "@/components/features/raffle/raffle-stamps-dialog";
import { RaffleWinnersLog } from "@/components/features/raffle/raffle-winners-log";
import { PageHeader } from "@/components/graphy/typo";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeToHackathons } from "@/lib/firebase/firestore";
import type {
  Hackathon,
  RaffleEntrant,
  RafflePrize,
  RaffleWinner,
  Stamp,
} from "@/lib/firebase/types";
import { splitHackathon } from "@/lib/utils";
import {
  fetchRaffleEntrants,
  subscribeToRafflePrizes,
  subscribeToRaffleSettings,
  subscribeToRaffleWinners,
} from "@/services/raffle";
import { subscribeToStamps } from "@/services/stamps";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/stampbook/raffle")({
  component: RafflePage,
});

const hackathonYear = (id: string) => Number(splitHackathon(id)[1] ?? 0);

const newestHackathonId = (hackathons: Hackathon[]) =>
  [...hackathons].sort((a, b) => hackathonYear(b._id) - hackathonYear(a._id))[0]?._id ?? "";

const sameStampIds = (current: string[], next: string[]) =>
  current.length === next.length && current.every((id, index) => id === next[index]);

function RafflePage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<string>("");
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [prizes, setPrizes] = useState<RafflePrize[]>([]);
  const [winners, setWinners] = useState<RaffleWinner[]>([]);
  const [eligibleStampIds, setEligibleStampIds] = useState<string[]>([]);
  const [entrants, setEntrants] = useState<RaffleEntrant[]>([]);
  const [poolLoading, setPoolLoading] = useState<boolean>(false);
  const [poolFetchedAt, setPoolFetchedAt] = useState<Date | null>(null);
  const [showEmails, setShowEmails] = useState<boolean>(false);
  const [stampsOpen, setStampsOpen] = useState<boolean>(false);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const unsubHackathons = subscribeToHackathons((docs) => {
      setHackathons(docs);
      setSelectedHackathon((current) => current || newestHackathonId(docs));
    });
    const unsubStamps = subscribeToStamps(setStamps);

    return () => {
      unsubHackathons();
      unsubStamps();
    };
  }, []);

  useEffect(() => {
    if (!selectedHackathon) return;

    // share one toast id so three failing subscriptions don't stack three toasts
    const onError = () =>
      toast.error("Couldn't load the raffle, you may not have access to this hackathon", {
        id: "raffle-subscription-error",
      });

    const unsubPrizes = subscribeToRafflePrizes(selectedHackathon, setPrizes, onError);
    const unsubWinners = subscribeToRaffleWinners(selectedHackathon, setWinners, onError);
    const unsubSettings = subscribeToRaffleSettings(
      selectedHackathon,
      (settings) =>
        setEligibleStampIds((current) =>
          sameStampIds(current, settings.eligibleStampIds) ? current : settings.eligibleStampIds,
        ),
      onError,
    );

    return () => {
      unsubPrizes();
      unsubWinners();
      unsubSettings();
    };
  }, [selectedHackathon]);

  const loadPool = useCallback(async (hackathon: string, stampIds: string[], refresh = false) => {
    if (!hackathon) {
      setEntrants([]);
      setPoolFetchedAt(null);
      return;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setPoolLoading(true);

    try {
      const pool = await fetchRaffleEntrants(hackathon, stampIds, refresh);
      if (requestId !== requestRef.current) return;
      setEntrants(pool);
      setPoolFetchedAt(new Date());
    } catch (error) {
      if (requestId !== requestRef.current) return;
      console.error("Error loading the raffle pool:", error);
      toast.error("Failed to load raffle entries");
    } finally {
      if (requestId === requestRef.current) setPoolLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPool(selectedHackathon, eligibleStampIds);
  }, [loadPool, selectedHackathon, eligibleStampIds]);

  return (
    <>
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <PageHeader className="font-medium">Raffle</PageHeader>
          <div className="flex items-center gap-2">
            <Select value={selectedHackathon} onValueChange={setSelectedHackathon}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select a hackathon..." />
              </SelectTrigger>
              <SelectContent>
                {hackathons.map((hackathon) => (
                  <SelectItem key={hackathon._id} value={hackathon._id}>
                    {hackathon._id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" asChild>
              <Link to="/stampbook">
                <ArrowLeft className="h-4 w-4" />
                Stampbook
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-16 lg:flex-row">
          <section className="flex flex-col gap-4 lg:w-[523px]">
            <h2 className="font-medium text-3xl">Set Prizes</h2>
            <RafflePrizesCard
              hackathon={selectedHackathon}
              prizes={prizes}
              winners={winners}
              className="flex-1"
            />
          </section>

          <RaffleDrawPanel
            key={selectedHackathon}
            hackathon={selectedHackathon}
            prizes={prizes}
            winners={winners}
            entrants={entrants}
            eligibleStampCount={eligibleStampIds.length}
            poolLoading={poolLoading}
            poolFetchedAt={poolFetchedAt}
            onRefreshPool={() => loadPool(selectedHackathon, eligibleStampIds, true)}
            onManageStamps={() => setStampsOpen(true)}
            className="lg:w-[482px]"
          />
        </div>

        <RaffleWinnersLog
          hackathon={selectedHackathon}
          winners={winners}
          showEmails={showEmails}
          onToggleEmails={setShowEmails}
        />
      </div>

      {selectedHackathon && (
        <RaffleStampsDialog
          open={stampsOpen}
          onClose={() => setStampsOpen(false)}
          hackathon={selectedHackathon}
          stamps={stamps}
          eligibleStampIds={eligibleStampIds}
        />
      )}
    </>
  );
}
