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
import type { WalletEmailDelivery, WalletEmailSend } from "@/lib/firebase/types";
import {
  countWalletEmailRecipients,
  startWalletEmailDelivery,
  subscribeToWalletEmailDelivery,
  subscribeToWalletEmailRecipients,
  subscribeToWalletEmailSends,
} from "@/services/wallet-email";
import { LoaderCircle, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type EmailBucket = "sending" | "sent" | "failed" | "uncertain" | "notSent";

const BUCKET_LABELS: Record<EmailBucket, string> = {
  sending: "Sending",
  sent: "Sent",
  failed: "Failed",
  uncertain: "Uncertain",
  notSent: "Not sent",
};

export function WalletEmailControl({
  hackathonId,
  disabled = false,
}: { hackathonId: string; disabled?: boolean }) {
  const [state, setState] = useState<WalletEmailDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [countError, setCountError] = useState<string | null>(null);
  const [sends, setSends] = useState<WalletEmailSend[] | null>(null);
  const [recipientUids, setRecipientUids] = useState<string[] | null>(null);
  const [sendsError, setSendsError] = useState<string | null>(null);
  const [recipientsError, setRecipientsError] = useState<string | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<EmailBucket | null>(null);
  const submitting = useRef(false);
  const countRequest = useRef(0);

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
    setSends(null);
    setRecipientUids(null);
    setSendsError(null);
    setRecipientsError(null);
    const unsubscribeSends = subscribeToWalletEmailSends(
      hackathonId,
      (next) => {
        setSends(next);
        setSendsError(null);
      },
      (failure) => setSendsError(`Could not load email send records: ${failure.message}`),
    );
    const unsubscribeRecipients = subscribeToWalletEmailRecipients(
      hackathonId,
      (uids) => {
        setRecipientUids(uids);
        setRecipientsError(null);
      },
      (failure) => setRecipientsError(`Could not load accepted applicants: ${failure.message}`),
    );
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => {
      unsubscribe();
      unsubscribeSends();
      unsubscribeRecipients();
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

  const openConfirm = () => {
    if (submitting.current || busy || loading || error) return;
    setRecipientCount(null);
    setCountError(null);
    setConfirmOpen(true);
    const request = ++countRequest.current;
    countWalletEmailRecipients(hackathonId)
      .then((count) => {
        if (countRequest.current === request) setRecipientCount(count);
      })
      .catch((failure) => {
        if (countRequest.current === request) {
          setCountError(
            failure instanceof Error ? failure.message : "Could not count wallet email recipients",
          );
        }
      });
  };

  const handleConfirm = async () => {
    if (submitting.current || busy || loading) return;
    submitting.current = true;
    setConfirmOpen(false);
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

  let recipientSummary = "Counting applicants marked accepted and attending…";
  if (countError) recipientSummary = "Could not count accepted and attending applicants.";
  else if (recipientCount === 0)
    recipientSummary =
      "No applicants are marked accepted and attending, so there is nobody to email.";
  else if (recipientCount !== null)
    recipientSummary = `This will email ${recipientCount} applicant${
      recipientCount === 1 ? "" : "s"
    } marked accepted and attending.`;

  const sendDocs = sends ?? [];
  const uidsForStatus = (status: WalletEmailSend["status"]) =>
    sendDocs
      .filter((send) => send.status === status)
      .map((send) => send.uid)
      .sort();
  const sendUids = new Set(sendDocs.map((send) => send.uid));
  const notSentUids = (recipientUids ?? []).filter((uid) => !sendUids.has(uid)).sort();
  const buckets: { key: EmailBucket; uids: string[] }[] = [
    { key: "sending", uids: uidsForStatus("sending") },
    { key: "sent", uids: uidsForStatus("sent") },
    { key: "failed", uids: uidsForStatus("failed") },
    { key: "uncertain", uids: uidsForStatus("uncertain") },
  ];
  if (recipientUids !== null) buckets.push({ key: "notSent", uids: notSentUids });
  const activeBucket = buckets.find((bucket) => bucket.key === selectedBucket);
  const showCounters =
    !loading && sends !== null && !sendsError && (state !== null || sendDocs.length > 0);

  return (
    <div className="min-w-0 space-y-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={openConfirm}
        disabled={disabled || busy || loading || !!error}
        aria-describedby={`wallet-email-status-${hackathonId}`}
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
        {busy
          ? "Sending wallet emails…"
          : needsRetry
            ? "Retry remaining emails"
            : "Send wallet emails"}
      </Button>
      {showCounters && (
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
              {BUCKET_LABELS[bucket.key]}
              <span className="font-semibold tabular-nums">{bucket.uids.length}</span>
            </Button>
          ))}
        </div>
      )}
      {!loading && state !== null && sends === null && !sendsError && (
        <p className="text-muted-foreground text-xs">Loading email send records…</p>
      )}
      {sendsError && <p className="text-destructive text-xs">{sendsError}</p>}
      {recipientsError && <p className="text-destructive text-xs">{recipientsError}</p>}
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
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send wallet emails?</AlertDialogTitle>
            <AlertDialogDescription>{recipientSummary}</AlertDialogDescription>
          </AlertDialogHeader>
          <Alert>
            <AlertTitle>Before you send</AlertTitle>
            <AlertDescription>
              Make sure the Apple passes have been created and uploaded for every attending
              applicant first. Delivery fails if any accepted applicant is missing a pass.
            </AlertDescription>
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
              <DialogTitle>{BUCKET_LABELS[activeBucket.key]} UIDs</DialogTitle>
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
