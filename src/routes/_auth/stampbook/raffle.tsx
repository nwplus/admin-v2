import { RaffleDrawPanel } from "@/components/features/raffle/raffle-draw-panel";
import { RafflePrizesCard } from "@/components/features/raffle/raffle-prizes-card";
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
import type { Hackathon, RaffleEntrant, RafflePrize, RaffleWinner } from "@/lib/firebase/types";
import { splitHackathon } from "@/lib/utils";
import {
  fetchRaffleEntrants,
  subscribeToRafflePrizes,
  subscribeToRaffleWinners,
} from "@/services/raffle";
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

function RafflePage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<string>("");
  const [prizes, setPrizes] = useState<RafflePrize[]>([]);
  const [winners, setWinners] = useState<RaffleWinner[]>([]);
  const [entrants, setEntrants] = useState<RaffleEntrant[]>([]);
  const [poolLoading, setPoolLoading] = useState<boolean>(false);
  const [poolError, setPoolError] = useState<boolean>(false);
  const [poolFetchedAt, setPoolFetchedAt] = useState<Date | null>(null);
  const [showEmails, setShowEmails] = useState<boolean>(false);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const unsubHackathons = subscribeToHackathons((docs) => {
      setHackathons(docs);
      setSelectedHackathon((current) => current || newestHackathonId(docs));
    });

    return unsubHackathons;
  }, []);

  useEffect(() => {
    if (!selectedHackathon) return;

    // share one toast id so two failing subscriptions don't stack two toasts
    const onError = () =>
      toast.error("Couldn't load the raffle, you may not have access to this hackathon", {
        id: "raffle-subscription-error",
      });

    const unsubPrizes = subscribeToRafflePrizes(selectedHackathon, setPrizes, onError);
    const unsubWinners = subscribeToRaffleWinners(selectedHackathon, setWinners, onError);

    return () => {
      unsubPrizes();
      unsubWinners();
    };
  }, [selectedHackathon]);

  const loadPool = useCallback(async (hackathon: string, refresh = false) => {
    if (!hackathon) {
      setEntrants([]);
      setPoolError(false);
      setPoolFetchedAt(null);
      return;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setPoolLoading(true);
    setPoolError(false);

    try {
      const pool = await fetchRaffleEntrants(hackathon, refresh);
      if (requestId !== requestRef.current) return;
      setEntrants(pool);
      setPoolFetchedAt(new Date());
    } catch (error) {
      if (requestId !== requestRef.current) return;
      console.error("Error loading the raffle pool:", error);
      // a stale pool must never be drawn from after a failed load
      setEntrants([]);
      setPoolFetchedAt(null);
      setPoolError(true);
      toast.error("Failed to load raffle entries");
    } finally {
      if (requestId === requestRef.current) setPoolLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPool(selectedHackathon);
  }, [loadPool, selectedHackathon]);

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
            poolLoading={poolLoading}
            poolError={poolError}
            poolFetchedAt={poolFetchedAt}
            onRefreshPool={() => loadPool(selectedHackathon, true)}
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
    </>
  );
}
