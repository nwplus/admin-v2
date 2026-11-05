import {
  type EmailDeliveryBucket,
  EmailDeliveryControl,
  type EmailDeliveryCopy,
} from "@/components/features/settings/email-delivery-control";
import type { WrappedEmailLedger, WrappedEmailRecipient } from "@/lib/firebase/types";
import {
  type WrappedSettings,
  countWrappedEmailRecipients,
  loadWrappedEmailRecipientUids,
  startWrappedEmailDelivery,
  subscribeToWrappedEmailLedger,
} from "@/services/wrapped-email";
import { useEffect, useRef, useState } from "react";

const FINISHED: WrappedEmailLedger["status"][] = ["completed", "completed-with-errors", "failed"];

const SKIP_REASONS: Record<NonNullable<WrappedEmailRecipient["r"]>, string> = {
  "no-wrapped-doc": "No Wrapped doc",
  "opted-out": "Opted out",
};

const copyFor = (hackathonId: string): EmailDeliveryCopy => ({
  idleLabel: "Send Wrapped emails",
  busyLabel: "Sending Wrapped emails…",
  retryLabel: "Retry remaining emails",
  idleStatus: "Wrapped docs and the banner must be ready. Sends to checked-in hackers.",
  loadingStatus: "Loading Wrapped email status…",
  preparingStatus: "Preparing recipients…",
  sendingStatus: (processed, total) =>
    `Sending Wrapped emails: ${processed} of ${total} processed.`,
  completedStatus: "Wrapped email delivery complete.",
  confirmTitle: "Send Wrapped emails?",
  countingSummary: "Counting checked-in hackers…",
  countErrorSummary: "Could not count checked-in hackers.",
  emptySummary:
    "No hackers are marked accepted, attending, and checked in, so there is nobody to email.",
  recipientSummary: (count) =>
    `This will email up to ${count} checked-in hacker${
      count === 1 ? "" : "s"
    } not yet emailed. Hackers without a Wrapped or who opted out are skipped.`,
  beforeYouSend: (
    <>
      Make sure every hacker's Wrapped doc has already been written (run{" "}
      <code className="font-mono">pnpm wrapped write</code> in portal-v2) and the banner is
      uploaded. Hackers without a Wrapped doc are skipped.
    </>
  ),
  countErrorFallback: "Could not count Wrapped email recipients",
  startedToast: `Wrapped emails started for ${hackathonId}`,
  alreadyRunningToast: "Wrapped emails are already running",
  startErrorFallback: "Could not start Wrapped emails",
});

export function WrappedEmailControl({
  hackathonId,
  settings,
  disabled = false,
}: {
  hackathonId: string;
  /** Saved Hackathons/{id}.wrapped; sending requires a release and a banner. */
  settings: WrappedSettings;
  /** True while a settings form on the page is being edited or saved. */
  disabled?: boolean;
}) {
  const [ledger, setLedger] = useState<WrappedEmailLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipientUids, setRecipientUids] = useState<string[] | null>(null);
  const [recipientsError, setRecipientsError] = useState<string | null>(null);
  const [reloadRecipients, setReloadRecipients] = useState(0);
  // undefined until the first snapshot, so the mount load is not repeated for a finished run.
  const previousRun = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    setLedger(null);
    setLoading(true);
    setError(null);
    previousRun.current = undefined;
    return subscribeToWrappedEmailLedger(
      hackathonId,
      (next) => {
        const run = next ? `${next.runId}:${next.status}` : null;
        if (
          previousRun.current !== undefined &&
          previousRun.current !== run &&
          next &&
          FINISHED.includes(next.status)
        ) {
          setReloadRecipients((count) => count + 1);
        }
        previousRun.current = run;
        setLedger(next);
        setLoading(false);
        setError(null);
      },
      (failure) => {
        setError(`Could not load Wrapped email status: ${failure.message}`);
        setLoading(false);
      },
    );
  }, [hackathonId]);

  // Recipients are read once per mount and after each finished run instead of live.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadRecipients only triggers a reload
  useEffect(() => {
    let active = true;
    setRecipientsError(null);
    loadWrappedEmailRecipientUids(hackathonId)
      .then((uids) => {
        if (active) setRecipientUids(uids);
      })
      .catch((failure) => {
        if (active) {
          setRecipientsError(
            `Could not load checked-in hackers: ${
              failure instanceof Error ? failure.message : String(failure)
            }`,
          );
        }
      });
    return () => {
      active = false;
    };
  }, [hackathonId, reloadRecipients]);

  const recipients = Object.entries(ledger?.recipients ?? {});
  const bucketFor = (
    key: string,
    label: string,
    status: WrappedEmailRecipient["s"],
    detail?: (recipient: WrappedEmailRecipient) => string | undefined,
  ): EmailDeliveryBucket => {
    const matching = recipients.filter(([, recipient]) => recipient.s === status);
    const details: Record<string, string> = {};
    for (const [uid, recipient] of matching) {
      const text = detail?.(recipient);
      if (text) details[uid] = text;
    }
    return { key, label, uids: matching.map(([uid]) => uid).sort(), details };
  };
  const buckets = [
    bucketFor("sent", "Sent", "sent"),
    bucketFor("skipped", "Skipped", "skipped", (recipient) =>
      recipient.r ? SKIP_REASONS[recipient.r] : recipient.e,
    ),
    bucketFor("failed", "Failed", "failed", (recipient) => recipient.e),
    bucketFor("uncertain", "Uncertain", "uncertain", (recipient) => recipient.e),
  ];
  if (recipientUids !== null) {
    const recorded = new Set(recipients.map(([uid]) => uid));
    buckets.push({
      key: "notSent",
      label: "Not sent",
      uids: recipientUids.filter((uid) => !recorded.has(uid)).sort(),
    });
  }

  let disabledReason: string | null = null;
  if (disabled) disabledReason = "Save or cancel your settings changes before sending.";
  else if (settings.isReady !== true)
    disabledReason = "Release Hacker Wrapped before sending emails.";
  else if (!settings.bannerUrl) disabledReason = "Upload a Wrapped banner before sending emails.";

  return (
    <EmailDeliveryControl
      statusId={`wrapped-email-status-${hackathonId}`}
      delivery={ledger}
      loading={loading}
      error={error}
      buckets={!loading && !error && ledger !== null ? buckets : null}
      bucketsLoadingText={
        !loading && ledger !== null && recipientUids === null && !recipientsError
          ? "Loading checked-in hackers…"
          : null
      }
      bucketErrors={[recipientsError]}
      countRecipients={() => countWrappedEmailRecipients(hackathonId)}
      start={() => startWrappedEmailDelivery(hackathonId)}
      copy={copyFor(hackathonId)}
      disabled={disabledReason !== null}
      disabledReason={disabledReason}
    />
  );
}
