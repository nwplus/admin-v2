import { RafflePrizesDialog } from "@/components/features/raffle/raffle-prizes-dialog";
import { RaffleStage } from "@/components/features/raffle/raffle-stage";
import { RaffleStampsDialog } from "@/components/features/raffle/raffle-stamps-dialog";
import { RaffleWinnersPanel } from "@/components/features/raffle/raffle-winners-panel";
import { PageHeader } from "@/components/graphy/typo";
import { Badge } from "@/components/ui/badge";
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

/** Hackathon IDs are name+year strings like "nwHacks2026". */
const hackathonYear = (id: string) => Number(id.match(/\d{4}/)?.[0] ?? 0);

const newestHackathonId = (hackathons: Hackathon[]) =>
  [...hackathons].sort((a, b) => hackathonYear(b._id) - hackathonYear(a._id))[0]?._id ?? "";

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
  const [prizesOpen, setPrizesOpen] = useState<boolean>(false);
  const [stampsOpen, setStampsOpen] = useState<boolean>(false);
  /** Guards against a slower earlier pool fetch landing after a newer one. */
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

    const unsubPrizes = subscribeToRafflePrizes(selectedHackathon, setPrizes);
    const unsubWinners = subscribeToRaffleWinners(selectedHackathon, setWinners);
    const unsubSettings = subscribeToRaffleSettings(selectedHackathon, (settings) =>
      setEligibleStampIds(settings.eligibleStampIds),
    );

    return () => {
      unsubPrizes();
      unsubWinners();
      unsubSettings();
    };
  }, [selectedHackathon]);

  // Reading Socials + Applicants takes a moment, so the pool is fetched once per hackathon/stamp
  // change and then refreshed on demand — organizers control freshness during a live event.
  const loadPool = useCallback(async (hackathon: string, stampIds: string[]) => {
    if (!hackathon) {
      setEntrants([]);
      setPoolFetchedAt(null);
      return;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setPoolLoading(true);

    try {
      const pool = await fetchRaffleEntrants(hackathon, stampIds);
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
      <div className="flex h-full w-full flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <PageHeader className="flex items-center gap-3">
            Raffle
            {selectedHackathon && <Badge variant="secondary">{selectedHackathon}</Badge>}
          </PageHeader>
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
                <ArrowLeft className="mr-2 h-4 w-4" />
                Stampbook
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          <RaffleStage
            key={selectedHackathon}
            hackathon={selectedHackathon}
            prizes={prizes}
            winners={winners}
            entrants={entrants}
            eligibleStampCount={eligibleStampIds.length}
            poolLoading={poolLoading}
            poolFetchedAt={poolFetchedAt}
            showEmails={showEmails}
            onRefreshPool={() => loadPool(selectedHackathon, eligibleStampIds)}
            onManagePrizes={() => setPrizesOpen(true)}
            onManageStamps={() => setStampsOpen(true)}
          />
          <RaffleWinnersPanel
            hackathon={selectedHackathon}
            winners={winners}
            showEmails={showEmails}
            onToggleEmails={() => setShowEmails((shown) => !shown)}
          />
        </div>
      </div>

      {selectedHackathon && (
        <>
          <RafflePrizesDialog
            open={prizesOpen}
            onClose={() => setPrizesOpen(false)}
            hackathon={selectedHackathon}
            prizes={prizes}
            winners={winners}
          />
          <RaffleStampsDialog
            open={stampsOpen}
            onClose={() => setStampsOpen(false)}
            hackathon={selectedHackathon}
            stamps={stamps}
            eligibleStampIds={eligibleStampIds}
          />
        </>
      )}
    </>
  );
}
