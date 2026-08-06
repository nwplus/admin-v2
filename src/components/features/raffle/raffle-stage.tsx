import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RaffleEntrant, RafflePrize, RaffleWinner } from "@/lib/firebase/types";
import {
  drawnCountForPrize,
  entrantsEligibleForPrize,
  nextPrizeSlot,
  pickWeightedWinner,
  remainingForPrize,
  totalEntries,
} from "@/lib/raffle";
import { obfuscateEmail } from "@/lib/utils";
import { RaffleSlotTakenError, addRaffleWinner } from "@/services/raffle";
import { Loader2, RefreshCw, Settings, Sparkles, Stamp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const SHUFFLE_DURATION_MS = 3500;
const REDUCED_MOTION_DURATION_MS = 900;
const SHUFFLE_MIN_DELAY_MS = 60;
const SHUFFLE_MAX_DELAY_MS = 400;

type DrawPhase = "idle" | "drawing" | "revealed";

const fullName = (entrant: RaffleEntrant) =>
  `${entrant.preferredName}${entrant.lastName ? ` ${entrant.lastName}` : ""}`;

interface RaffleStageProps {
  hackathon: string;
  prizes: RafflePrize[];
  winners: RaffleWinner[];
  entrants: RaffleEntrant[];
  eligibleStampCount: number;
  poolLoading: boolean;
  poolFetchedAt: Date | null;
  showEmails: boolean;
  onRefreshPool: () => void;
  onManagePrizes: () => void;
  onManageStamps: () => void;
}

export function RaffleStage({
  hackathon,
  prizes,
  winners,
  entrants,
  eligibleStampCount,
  poolLoading,
  poolFetchedAt,
  showEmails,
  onRefreshPool,
  onManagePrizes,
  onManageStamps,
}: RaffleStageProps) {
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>("");
  const [phase, setPhase] = useState<DrawPhase>("idle");
  const [shuffleName, setShuffleName] = useState<string>("");
  const [winner, setWinner] = useState<RaffleEntrant | null>(null);
  const [confirming, setConfirming] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );
  
  const selectedPrize =
    prizes.find((prize) => prize._id === selectedPrizeId) ??
    prizes.find((prize) => remainingForPrize(prize, winners) > 0) ??
    null;
  const remaining = selectedPrize ? remainingForPrize(selectedPrize, winners) : 0;
  const poolEntries = totalEntries(entrants);

  // winning a prize does not rule a hacker out of winning other prizes
  const drawPool = entrantsEligibleForPrize(entrants, winners, selectedPrize?._id);
  const drawableEntries = totalEntries(drawPool);

  const disabledReason =
    prizes.length === 0
      ? "Add prizes before drawing"
      : eligibleStampCount === 0
        ? "Choose which stamps count as entries"
        : poolLoading
          ? "Loading the entry pool..."
          : poolEntries === 0
            ? "No entries yet, nobody has collected an eligible stamp"
            : !selectedPrize
              ? "Every prize has been fully drawn"
              : remaining <= 0
                ? `All ${selectedPrize.quantity} of "${selectedPrize.name}" have been drawn`
                : drawableEntries === 0
                  ? `Everyone in the pool has already won "${selectedPrize.name}"`
                  : null;

  const startDraw = () => {
    const picked = pickWeightedWinner(drawPool);
    if (!picked) {
      toast.error("There are no entries to draw from");
      return;
    }

    clearTimer();
    setWinner(null);
    setPhase("drawing");

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const duration = reducedMotion ? REDUCED_MOTION_DURATION_MS : SHUFFLE_DURATION_MS;
    const startedAt = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startedAt;
      if (elapsed >= duration) {
        timerRef.current = null;
        setWinner(picked);
        setPhase("revealed");
        return;
      }

      const sample = drawPool[Math.floor(Math.random() * drawPool.length)];
      if (sample) setShuffleName(fullName(sample));

      // ease out cubically
      const progress = elapsed / duration;
      const delay =
        SHUFFLE_MIN_DELAY_MS + (SHUFFLE_MAX_DELAY_MS - SHUFFLE_MIN_DELAY_MS) * progress ** 3;
      timerRef.current = setTimeout(tick, delay);
    };

    tick();
  };

  const dismissReveal = () => {
    setWinner(null);
    setPhase("idle");
  };

  const confirmWinner = async () => {
    if (!winner || !selectedPrize?._id || confirming) return;

    // check against the current winners log
    if (remaining <= 0) {
      toast.error(`Every "${selectedPrize.name}" has already been drawn`);
      dismissReveal();
      return;
    }

    if (
      winners.some((entry) => entry.prizeId === selectedPrize._id && entry.email === winner.email)
    ) {
      toast.error(`${winner.preferredName} has already won "${selectedPrize.name}"`);
      dismissReveal();
      return;
    }

    setConfirming(true);
    try {
      const logged = await addRaffleWinner(
        hackathon,
        {
          prizeId: selectedPrize._id,
          prizeName: selectedPrize.name,
          preferredName: winner.preferredName,
          lastName: winner.lastName,
          email: winner.email,
          entryCount: winner.entries,
        },
        nextPrizeSlot(winners, selectedPrize._id),
      );
      if (!logged) throw new Error("Error logging the raffle winner");

      toast.success(`${winner.preferredName} wins ${selectedPrize.name}!`);
      dismissReveal();
    } catch (error) {
      if (error instanceof RaffleSlotTakenError) {
        toast.error(`Another organizer just drew this "${selectedPrize.name}", draw again`);
        dismissReveal();
        return;
      }
      console.error("Error logging the raffle winner", error);
      toast.error("Something went wrong logging this winner");
    } finally {
      setConfirming(false);
    }
  };

  const previousWins = winner
    ? winners.filter((entry) => entry.email === winner.email).map((entry) => entry.prizeName)
    : [];

  return (
    <Card className="flex flex-1 flex-col rounded-xl">
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-56 flex-1 space-y-2">
            <span className="font-medium text-sm">Prize</span>
            <Select
              value={selectedPrize?._id ?? ""}
              onValueChange={setSelectedPrizeId}
              disabled={phase === "drawing"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a prize..." />
              </SelectTrigger>
              <SelectContent>
                {prizes
                  .filter((prize) => prize._id)
                  .map((prize) => {
                    const drawn = drawnCountForPrize(winners, prize._id);
                    return (
                      <SelectItem
                        key={prize._id}
                        value={prize._id as string}
                        disabled={drawn >= prize.quantity}
                      >
                        {prize.name} · {drawn}/{prize.quantity} drawn
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={onManagePrizes} title="Manage prizes">
            <Settings className="mr-2 h-4 w-4" />
            Prizes
          </Button>
          <Button variant="outline" onClick={onManageStamps} title="Choose eligible stamps">
            <Stamp className="mr-2 h-4 w-4" />
            Stamps
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-sm">
          {poolLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading entries...
            </span>
          ) : (
            <span>
              <span className="font-medium text-foreground">{poolEntries}</span> entries from{" "}
              <span className="font-medium text-foreground">{entrants.length}</span> hackers across{" "}
              {eligibleStampCount} eligible stamp{eligibleStampCount === 1 ? "" : "s"}
            </span>
          )}
          {poolFetchedAt && !poolLoading && (
            <span className="text-xs">· as of {poolFetchedAt.toLocaleTimeString()}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefreshPool}
            disabled={poolLoading || phase === "drawing"}
            className="h-auto px-2 py-1 text-xs"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Refresh
          </Button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg bg-theme px-6 py-16 text-center text-foreground-theme">
          {phase === "idle" && (
            <>
              <Sparkles className="h-10 w-10 text-theme-green" />
              <p className="font-semibold text-3xl">
                {selectedPrize ? selectedPrize.name : "Raffle"}
              </p>
              <p className="text-foreground-theme/70 text-sm">
                {disabledReason ?? `${remaining} left to draw`}
              </p>
            </>
          )}

          {phase === "drawing" && (
            <>
              <p className="text-foreground-theme/70 text-sm uppercase tracking-widest">
                Drawing for {selectedPrize?.name}
              </p>
              <p className="font-bold text-4xl sm:text-5xl">{shuffleName || "..."}</p>
              <Loader2 className="h-6 w-6 animate-spin text-theme-green" />
            </>
          )}

          {phase === "revealed" && winner && (
            <div className="zoom-in-95 fade-in animate-in space-y-3 duration-700">
              <p className="text-foreground-theme/70 text-sm uppercase tracking-widest">
                {selectedPrize?.name}
              </p>
              <p className="font-bold text-5xl text-theme-green sm:text-6xl">{fullName(winner)}</p>
              <p className="text-foreground-theme/70 text-sm">
                {showEmails ? winner.email : obfuscateEmail(winner.email)} · {winner.entries} stamp
                {winner.entries === 1 ? "" : "s"}
              </p>
              {previousWins.length > 0 && (
                <p className="text-theme-green/80 text-xs">
                  Already won: {previousWins.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          {phase === "revealed" ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button size="lg" onClick={confirmWinner} disabled={confirming}>
                {confirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm winner
              </Button>
              <Button size="lg" variant="outline" onClick={startDraw} disabled={confirming}>
                Draw again
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              onClick={startDraw}
              disabled={phase === "drawing" || !!disabledReason}
              className="px-10 text-base"
            >
              {phase === "drawing" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Draw winner
            </Button>
          )}
          {phase === "idle" && disabledReason && (
            <p className="text-muted-foreground text-xs">{disabledReason}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
