import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WalletEmailDelivery } from "@/lib/firebase/types";
import { LoaderCircle, Mail } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** Run-status fields shared by every email delivery written by Functions-new. */
export type EmailDeliveryState = WalletEmailDelivery;

export interface EmailDeliveryBucket {
  key: string;
  label: string;
  uids: string[];
  /** Optional per-uid note shown in the UID list, e.g. a skip reason or error. */
  details?: Record<string, string>;
}

export interface EmailDeliveryCopy {
  idleLabel: string;
  busyLabel: string;
  retryLabel: string;
  idleStatus: string;
  loadingStatus: string;
  preparingStatus: string;
  sendingStatus: (processed: number, total: number) => string;
  completedStatus: string;
  confirmTitle: string;
  countingSummary: string;
  countErrorSummary: string;
  emptySummary: string;
  recipientSummary: (count: number) => string;
  beforeYouSend: ReactNode;
  countErrorFallback: string;
  startedToast: string;
  alreadyRunningToast: string;
  startErrorFallback: string;
}

/**
 * Presentational send button, live status, and per-recipient counters for a
 * server-side email delivery. Callers own all data fetching.
 */
export function EmailDeliveryControl({
  statusId,
  delivery: state,
  loading,
  error,
  buckets,
  bucketsLoadingText,
  bucketErrors = [],
  countRecipients,
  start,
  copy,
  disabled = false,
  disabledReason,
}: {
  statusId: string;
  delivery: EmailDeliveryState | null;
  loading: boolean;
  error: string | null;
  /** null hides the counters, e.g. while records load or after a read error. */
  buckets: EmailDeliveryBucket[] | null;
  bucketsLoadingText?: string | null;
  bucketErrors?: (string | null)[];
  countRecipients: () => Promise<number>;
  start: () => Promise<{ started: boolean }>;
  copy: EmailDeliveryCopy;
  disabled?: boolean;
  disabledReason?: string | null;
}) {
  const [starting, setStarting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [countError, setCountError] = useState<string | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const submitting = useRef(false);
  const countRequest = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

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

  const openConfirm = () => {
    if (submitting.current || busy || loading || error) return;
    setRecipientCount(null);
    setCountError(null);
    setConfirmOpen(true);
    const request = ++countRequest.current;
    countRecipients()
      .then((count) => {
        if (countRequest.current === request) setRecipientCount(count);
      })
      .catch((failure) => {
        if (countRequest.current === request) {
          setCountError(failure instanceof Error ? failure.message : copy.countErrorFallback);
        }
      });
  };

  const handleConfirm = async () => {
    if (submitting.current || busy || loading) return;
    submitting.current = true;
    setConfirmOpen(false);
    setStarting(true);
    try {
      const result = await start();
      toast.success(result.started ? copy.startedToast : copy.alreadyRunningToast);
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : copy.startErrorFallback);
    } finally {
      submitting.current = false;
      setStarting(false);
    }
  };

  let status = copy.idleStatus;
  if (loading) status = copy.loadingStatus;
  else if (interrupted) status = "Delivery was interrupted. Resume to check remaining emails.";
  else if (state?.status === "preparing") status = copy.preparingStatus;
  else if (state?.status === "queued") status = "Queued. Delivery continues in the background.";
  else if (state?.status === "sending") status = copy.sendingStatus(processed, state.total);
  else if (state?.status === "completed") status = copy.completedStatus;
  else if (state?.status === "completed-with-errors")
    status = "Delivery finished with emails that need attention.";
  else if (state?.status === "failed")
    status = state.error || "Delivery stopped. Retry to continue.";

  let recipientSummary = copy.countingSummary;
  if (countError) recipientSummary = copy.countErrorSummary;
  else if (recipientCount === 0) recipientSummary = copy.emptySummary;
  else if (recipientCount !== null) recipientSummary = copy.recipientSummary(recipientCount);

  const activeBucket = buckets?.find((bucket) => bucket.key === selectedBucket);

  return (
    <div className="min-w-0 space-y-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={openConfirm}
        disabled={disabled || busy || loading || !!error}
        aria-describedby={statusId}
        aria-haspopup="dialog"
      >
        {busy ? (
          <LoaderCircle
            className="h-4 w-4 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        ) : (
          <Mail className="h-4 w-4" aria-hidden="true" />
        )}
        {busy ? copy.busyLabel : needsRetry ? copy.retryLabel : copy.idleLabel}
      </Button>
      {buckets && (
        <div className="flex flex-wrap gap-1">
          {buckets.map((bucket) => (
            <Button
              key={bucket.key}
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2 font-normal text-xs"
              onClick={() => setSelectedBucket(bucket.key)}
            >
              {bucket.label}
              <span className="font-semibold tabular-nums">{bucket.uids.length}</span>
            </Button>
          ))}
        </div>
      )}
      {bucketsLoadingText && <p className="text-muted-foreground text-xs">{bucketsLoadingText}</p>}
      {bucketErrors.map(
        (bucketError) =>
          bucketError && (
            <p key={bucketError} className="text-destructive text-xs">
              {bucketError}
            </p>
          ),
      )}
      <output
        id={statusId}
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
        {disabled && disabledReason && <span className="block">{disabledReason}</span>}
      </output>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{recipientSummary}</AlertDialogDescription>
          </AlertDialogHeader>
          <Alert>
            <AlertTitle>Before you send</AlertTitle>
            <AlertDescription>{copy.beforeYouSend}</AlertDescription>
          </Alert>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={recipientCount === null || recipientCount === 0 || !!countError}
            >
              Send emails
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={!!activeBucket}
        onOpenChange={(open) => {
          if (!open) setSelectedBucket(null);
        }}
      >
        {activeBucket && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{activeBucket.label} UIDs</DialogTitle>
              <DialogDescription>
                {activeBucket.uids.length} applicant
                {activeBucket.uids.length === 1 ? "" : "s"}.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-80 overflow-y-auto rounded-md border p-2">
              {activeBucket.uids.length === 0 ? (
                <p className="text-muted-foreground text-sm">No UIDs.</p>
              ) : (
                <ul className="space-y-1 font-mono text-xs">
                  {activeBucket.uids.map((uid) => (
                    <li key={uid} className="break-all">
                      {uid}
                      {activeBucket.details?.[uid] && (
                        <span className="block font-sans text-muted-foreground">
                          {activeBucket.details[uid]}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
