import { Button } from "@/components/ui/button";
import type { WalletEmailDelivery } from "@/lib/firebase/types";
import { startWalletEmailDelivery, subscribeToWalletEmailDelivery } from "@/services/wallet-email";
import { LoaderCircle, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function WalletEmailControl({
  hackathonId,
  disabled = false,
}: { hackathonId: string; disabled?: boolean }) {
  const [state, setState] = useState<WalletEmailDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const submitting = useRef(false);

  useEffect(() => {
    setState(null);
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToWalletEmailDelivery(
      hackathonId,
      (next) => {
        setState(next);
        setLoading(false);
        setError(null);
      },
      (failure) => {
        setError(`Could not load wallet email status: ${failure.message}`);
        setLoading(false);
      },
    );
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [hackathonId]);

  const inProgress = !!state && ["preparing", "queued", "sending"].includes(state.status);
  const interrupted = inProgress && now - state.updatedAt.toMillis() >= 60 * 60 * 1000;
  const busy = starting || (inProgress && !interrupted);
  const current = inProgress && !interrupted ? state?.currentProgress : undefined;
  const sent = (state?.sent ?? 0) + (current?.sent ?? 0);
  const skipped = (state?.skipped ?? 0) + (current?.skipped ?? 0);
  const failed = (state?.failed ?? 0) + (current?.failed ?? 0);
  const uncertain = (state?.uncertain ?? 0) + (current?.uncertain ?? 0);
  const processed = Math.min(
    state?.total ?? 0,
    (state?.processed ?? 0) +
      (current ? current.sent + current.skipped + current.failed + current.uncertain : 0),
  );
  const needsRetry =
    interrupted || state?.status === "failed" || state?.status === "completed-with-errors";
  const lastClicked = state?.lastClickedAt.toDate();

  const handleClick = async () => {
    if (submitting.current || busy || loading || error) return;
    submitting.current = true;
    setStarting(true);
    try {
      const result = await startWalletEmailDelivery(hackathonId);
      toast.success(
        result.started
          ? `Wallet emails started for ${hackathonId}`
          : "Wallet emails are already running",
      );
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Could not start wallet emails");
    } finally {
      submitting.current = false;
      setStarting(false);
    }
  };

  let status = "Apple passes must already be uploaded. Sends to attending hackers.";
  if (loading) status = "Loading wallet email status…";
  else if (interrupted) status = "Delivery was interrupted. Resume to check remaining emails.";
  else if (state?.status === "preparing") status = "Checking Apple passes…";
  else if (state?.status === "queued") status = "Queued. Delivery continues in the background.";
  else if (state?.status === "sending")
    status = `Sending wallet emails: ${processed} of ${state.total} processed.`;
  else if (state?.status === "completed") status = "Wallet email delivery complete.";
  else if (state?.status === "completed-with-errors")
    status = "Delivery finished with emails that need attention.";
  else if (state?.status === "failed")
    status = state.error || "Delivery stopped. Retry to continue.";

  return (
    <div className="min-w-0 space-y-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleClick}
        disabled={disabled || busy || loading || !!error}
        aria-describedby={`wallet-email-status-${hackathonId}`}
      >
        {busy ? (
          <LoaderCircle
            className="h-4 w-4 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        ) : (
          <Mail className="h-4 w-4" aria-hidden="true" />
        )}
        {busy
          ? "Sending wallet emails…"
          : needsRetry
            ? "Retry remaining emails"
            : "Send wallet emails"}
      </Button>
      <output
        id={`wallet-email-status-${hackathonId}`}
        aria-live="polite"
        className="block max-w-md space-y-1 text-muted-foreground text-xs"
      >
        <span className="block">{error || status}</span>
        {state && state.total > 0 && (
          <span className="block">
            {sent} sent · {skipped} already sent or skipped · {failed} failed
            {uncertain > 0 ? ` · ${uncertain} need review` : ""}
          </span>
        )}
        {uncertain > 0 && (
          <span className="block">
            Check the sender mailbox for unconfirmed deliveries. They will not be sent again
            automatically.
          </span>
        )}
        {lastClicked ? (
          <span className="block">
            Last clicked{" "}
            <time dateTime={lastClicked.toISOString()}>{lastClicked.toLocaleString()}</time>
            {state?.startedByEmail ? ` by ${state.startedByEmail}` : ""}.
          </span>
        ) : (
          !loading && <span className="block">Not sent yet.</span>
        )}
        {busy && <span className="block">You can close this page. Delivery will continue.</span>}
        {disabled && (
          <span className="block">Save or cancel your settings changes before sending.</span>
        )}
      </output>
    </div>
  );
}
