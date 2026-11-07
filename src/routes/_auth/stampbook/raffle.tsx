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
import { defaultRaffleHackathon } from "@/lib/raffle";
import { isHackathonEvent } from "@/lib/utils";
import { getAdminFlags } from "@/services/evaluator";
import {
  fetchRaffleEntrants,
  subscribeToRafflePrizes,
  subscribeToRaffleWinners,
} from "@/services/raffle";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface RaffleSearch {
  /** the hackathon the raffle is open on, kept in the URL so organizers can share one link */
  hackathon?: string;
}

export const Route = createFileRoute("/_auth/stampbook/raffle")({
  component: RafflePage,
  validateSearch: (search: Record<string, unknown>): RaffleSearch => ({
    hackathon:
      typeof search.hackathon === "string" && search.hackathon ? search.hackathon : undefined,
  }),
});

function RafflePage() {
  const { hackathon: searchHackathon } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  // null until the CMS has been read, so the default isn't chosen without it
  const [activeHackathon, setActiveHackathon] = useState<string | null>(null);
  const [prizes, setPrizes] = useState<RafflePrize[]>([]);
  const [winners, setWinners] = useState<RaffleWinner[]>([]);
  const [entrants, setEntrants] = useState<RaffleEntrant[]>([]);
  const [excludedOrganizers, setExcludedOrganizers] = useState<number>(0);
  const [poolLoading, setPoolLoading] = useState<boolean>(false);
  const [poolError, setPoolError] = useState<boolean>(false);
  const [poolFetchedAt, setPoolFetchedAt] = useState<Date | null>(null);
  const [showEmails, setShowEmails] = useState<boolean>(false);
  const requestRef = useRef<number>(0);

  // only real events are offered, so `blacklist`, `www` and test documents can't be drawn from
  const events = useMemo(
    () =>
      hackathons.filter(
        (hackathon) => isHackathonEvent(hackathon._id) && !hackathon.featureFlags?.test,
      ),
    [hackathons],
  );

  // the URL is the only source of the selection, so a Hackathons snapshot arriving mid-draw
  // can't switch the page to another event the way a re-derived default would
  const selectedHackathon =
    searchHackathon && events.some((hackathon) => hackathon._id === searchHackathon)
      ? searchHackathon
      : "";

  const selectHackathon = (hackathon: string) => navigate({ search: { hackathon }, replace: true });

  useEffect(() => subscribeToHackathons(setHackathons), []);

  useEffect(() => {
    let cancelled = false;
    getAdminFlags().then((flags) => {
      if (!cancelled) setActiveHackathon(flags?.activeHackathon ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // without a usable hackathon in the URL, pick one once and write it there
  useEffect(() => {
    if (selectedHackathon || activeHackathon === null || events.length === 0) return;
    const fallback = defaultRaffleHackathon(
      events.map((hackathon) => hackathon._id),
      activeHackathon,
    );
    if (fallback) navigate({ search: { hackathon: fallback }, replace: true });
  }, [selectedHackathon, activeHackathon, events, navigate]);

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
      setExcludedOrganizers(0);
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
      setEntrants(pool.entrants);
      setExcludedOrganizers(pool.excludedOrganizers);
      setPoolFetchedAt(new Date());
    } catch (error) {
      if (requestId !== requestRef.current) return;
      console.error("Error loading the raffle pool:", error);
      // a stale pool must never be drawn from after a failed load
      setEntrants([]);
      setExcludedOrganizers(0);
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
            <Select value={selectedHackathon} onValueChange={selectHackathon}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select a hackathon..." />
              </SelectTrigger>
              <SelectContent>
                {events.map((hackathon) => (
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
            excludedOrganizers={excludedOrganizers}
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
