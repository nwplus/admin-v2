import { RaffleWinnerDialog } from "@/components/features/raffle/raffle-winner-dialog";
import { PageHeader } from "@/components/graphy/typo";
import { Button } from "@/components/ui/button";
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
  remainingForPrize,
  totalEntries,
} from "@/lib/raffle";
import { cn } from "@/lib/utils";
import { Gift, Loader2, RefreshCw, Stamp } from "lucide-react";
import { useState } from "react";

interface RaffleDrawPanelProps {
  hackathon: string;
  prizes: RafflePrize[];
  winners: RaffleWinner[];
  entrants: RaffleEntrant[];
  eligibleStampCount: number;
  poolLoading: boolean;
  poolFetchedAt: Date | null;
  onRefreshPool: () => void;
  onManageStamps: () => void;
  className?: string;
}

export function RaffleDrawPanel({
  hackathon,
  prizes,
  winners,
  entrants,
  eligibleStampCount,
  poolLoading,
  poolFetchedAt,
  onRefreshPool,
  onManageStamps,
  className,
}: RaffleDrawPanelProps) {
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>("");
  const [drawOpen, setDrawOpen] = useState<boolean>(false);

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

  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <PageHeader className="font-medium">Live Raffle</PageHeader>
      <p className="text-lg text-muted-foreground">Select a prize and draw a winner.</p>

      <div className="flex flex-wrap items-start gap-8">
        <div className="flex w-[280px] max-w-full flex-col gap-4">
          <p className="font-medium text-muted-foreground text-xl">1. Select Prize</p>
          <Select value={selectedPrize?._id ?? ""} onValueChange={setSelectedPrizeId}>
            <SelectTrigger className="h-10 w-full">
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

        <div className="flex flex-col gap-4">
          <p className="font-medium text-muted-foreground text-xl">2. Draw Winner</p>
          <Button
            variant="outline"
            onClick={() => setDrawOpen(true)}
            disabled={!!disabledReason}
            title={disabledReason ?? undefined}
          >
            <Gift className="size-4" />
            Draw Winner
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-sm">
        {poolLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-3 animate-spin" />
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
          disabled={poolLoading}
          className="h-auto px-2 py-1 text-xs"
        >
          <RefreshCw className="size-3" />
          Refresh
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onManageStamps}
          className="h-auto px-2 py-1 text-xs"
        >
          <Stamp className="size-3" />
          Eligible stamps
        </Button>
      </div>

      {disabledReason && <p className="text-muted-foreground text-xs">{disabledReason}</p>}

      <RaffleWinnerDialog
        open={drawOpen}
        onClose={() => setDrawOpen(false)}
        hackathon={hackathon}
        prize={selectedPrize}
        drawPool={drawPool}
        winners={winners}
      />
    </section>
  );
}
