import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import type { RaffleEntrant, RafflePrize, RaffleWinner } from "@/lib/firebase/types";
import { nextPrizeSlot, pickWeightedWinner, remainingForPrize } from "@/lib/raffle";
import { RaffleSlotTakenError, addRaffleWinner } from "@/services/raffle";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const SHUFFLE_DURATION_MS = 3500;
const REDUCED_MOTION_DURATION_MS = 900;
const SHUFFLE_MIN_DELAY_MS = 60;
const SHUFFLE_MAX_DELAY_MS = 400;

type DrawPhase = "drawing" | "revealed";

interface RaffleWinnerDialogProps {
  open: boolean;
  onClose: () => void;
  hackathon: string;
  prize: RafflePrize | null;
  drawPool: RaffleEntrant[];
  winners: RaffleWinner[];
}

export function RaffleWinnerDialog({
  open,
  onClose,
  hackathon,
  prize,
  drawPool,
  winners,
}: RaffleWinnerDialogProps) {
  const [phase, setPhase] = useState<DrawPhase>("drawing");
  const [shown, setShown] = useState<RaffleEntrant | null>(null);
  const [winner, setWinner] = useState<RaffleEntrant | null>(null);
  const [confirming, setConfirming] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // the draw effect keys off `open` alone, so it must reach these through a ref:
  // `onClose` is a fresh arrow on every parent render, and a winners snapshot landing
  // mid-shuffle would otherwise restart the draw and re-pick a different winner
  const latest = useRef({ drawPool, onClose });
  latest.current = { drawPool, onClose };

  useEffect(() => {
    if (!open) return;

    const { drawPool: pool, onClose: close } = latest.current;
    const picked = pickWeightedWinner(pool);
    if (!picked) {
      toast.error("There are no entries to draw from");
      close();
      return;
    }

    setWinner(null);
    setShown(null);
    setPhase("drawing");

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const duration = reducedMotion ? REDUCED_MOTION_DURATION_MS : SHUFFLE_DURATION_MS;
    const startedAt = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startedAt;
      if (elapsed >= duration) {
        timerRef.current = null;
        setWinner(picked);
        setShown(picked);
        setPhase("revealed");
        return;
      }

      const sample = pool[Math.floor(Math.random() * pool.length)];
      if (sample) setShown(sample);

      // ease out cubically
      const progress = elapsed / duration;
      const delay =
        SHUFFLE_MIN_DELAY_MS + (SHUFFLE_MAX_DELAY_MS - SHUFFLE_MIN_DELAY_MS) * progress ** 3;
      timerRef.current = setTimeout(tick, delay);
    };

    tick();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [open]);

  const confirmWinner = async () => {
    if (!winner || !prize?._id || confirming) return;

    // re-check against the current winners log, another organizer may have drawn since
    if (remainingForPrize(prize, winners) <= 0) {
      toast.error(`Every "${prize.name}" has already been drawn`);
      onClose();
      return;
    }

    if (winners.some((entry) => entry.prizeId === prize._id && entry.email === winner.email)) {
      toast.error(`${winner.preferredName} has already won "${prize.name}"`);
      onClose();
      return;
    }

    setConfirming(true);
    try {
      const logged = await addRaffleWinner(
        hackathon,
        {
          prizeId: prize._id,
          prizeName: prize.name,
          preferredName: winner.preferredName,
          lastName: winner.lastName,
          email: winner.email,
          entryCount: winner.entries,
        },
        nextPrizeSlot(winners, prize._id),
      );
      if (!logged) throw new Error("Error logging the raffle winner");

      toast.success(`${winner.preferredName} wins ${prize.name}!`);
      onClose();
    } catch (error) {
      if (error instanceof RaffleSlotTakenError) {
        toast.error(`Another organizer just drew this "${prize.name}", draw again`);
        onClose();
        return;
      }
      console.error("Error logging the raffle winner", error);
      toast.error("Something went wrong logging this winner");
    } finally {
      setConfirming(false);
    }
  };

  const drawing = phase === "drawing";

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state && !confirming) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        overlayClassName="bg-[#d9d9d9]/35 backdrop-blur-[2.5px]"
        className="flex min-h-[520px] flex-col sm:min-h-[592px] sm:max-w-[813px]"
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-12 text-center">
          <DialogTitle className="font-medium text-3xl">And our winner is...</DialogTitle>

          <div
            className={
              drawing
                ? "flex flex-col items-center gap-4"
                : "zoom-in-95 fade-in flex animate-in flex-col items-center gap-4 duration-500"
            }
          >
            <p className="font-semibold text-5xl">{shown?.preferredName ?? "..."}</p>
            <p className="font-medium text-3xl">{shown?.lastName || " "}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={confirming}>
            <X className="size-4" />
            Cancel
          </Button>
          <Button onClick={confirmWinner} disabled={drawing || confirming}>
            {confirming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Confirm Winner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
