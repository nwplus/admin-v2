import {
  type EmailDeliveryBucket,
  EmailDeliveryControl,
  type EmailDeliveryCopy,
} from "@/components/features/settings/email-delivery-control";
import { type WalletEmailData, useWalletEmailData } from "@/hooks/use-wallet-email-data";
import type { WalletEmailSend } from "@/lib/firebase/types";
import { countWalletEmailRecipients, startWalletEmailDelivery } from "@/services/wallet-email";

const copyFor = (hackathonId: string): EmailDeliveryCopy => ({
  idleLabel: "Send wallet emails",
  busyLabel: "Sending wallet emails…",
  retryLabel: "Retry remaining emails",
  idleStatus: "Apple passes must already be uploaded. Sends to attending hackers.",
  loadingStatus: "Loading wallet email status…",
  preparingStatus: "Checking Apple passes…",
  sendingStatus: (processed, total) => `Sending wallet emails: ${processed} of ${total} processed.`,
  completedStatus: "Wallet email delivery complete.",
  confirmTitle: "Send wallet emails?",
  countingSummary: "Counting applicants marked accepted and attending…",
  countErrorSummary: "Could not count accepted and attending applicants.",
  emptySummary: "No applicants are marked accepted and attending, so there is nobody to email.",
  recipientSummary: (count) =>
    `This will email ${count} applicant${count === 1 ? "" : "s"} marked accepted and attending.`,
  beforeYouSend:
    "Make sure the Apple passes have been created and uploaded for every attending applicant first. Delivery fails if any accepted applicant is missing a pass.",
  countErrorFallback: "Could not count wallet email recipients",
  startedToast: `Wallet emails started for ${hackathonId}`,
  alreadyRunningToast: "Wallet emails are already running",
  startErrorFallback: "Could not start wallet emails",
});

type WalletEmailControlProps = {
  hackathonId: string;
  disabled?: boolean;
  data?: WalletEmailData;
};

export function WalletEmailControl({
  hackathonId,
  disabled = false,
  data,
}: WalletEmailControlProps) {
  if (data) {
    return <WalletEmailControlView hackathonId={hackathonId} disabled={disabled} data={data} />;
  }
  return <WalletEmailControlSubscribed hackathonId={hackathonId} disabled={disabled} />;
}

function WalletEmailControlSubscribed({
  hackathonId,
  disabled = false,
}: { hackathonId: string; disabled?: boolean }) {
  const data = useWalletEmailData(hackathonId);
  return <WalletEmailControlView hackathonId={hackathonId} disabled={disabled} data={data} />;
}

function WalletEmailControlView({
  hackathonId,
  disabled = false,
  data,
}: {
  hackathonId: string;
  disabled?: boolean;
  data: WalletEmailData;
}) {
  const {
    delivery: state,
    loading,
    error,
    sends,
    recipientUids,
    sendsError,
    recipientsError,
  } = data;
  const sendDocs = sends ?? [];
  const uidsForStatus = (status: WalletEmailSend["status"]) =>
    sendDocs
      .filter((send) => send.status === status)
      .map((send) => send.uid)
      .sort();
  const sendUids = new Set(sendDocs.map((send) => send.uid));
  const notSentUids = (recipientUids ?? []).filter((uid) => !sendUids.has(uid)).sort();
  const buckets: EmailDeliveryBucket[] = [
    { key: "sending", label: "Sending", uids: uidsForStatus("sending") },
    { key: "sent", label: "Sent", uids: uidsForStatus("sent") },
    { key: "failed", label: "Failed", uids: uidsForStatus("failed") },
    { key: "uncertain", label: "Uncertain", uids: uidsForStatus("uncertain") },
  ];
  if (recipientUids !== null)
    buckets.push({ key: "notSent", label: "Not sent", uids: notSentUids });
  const showCounters =
    !loading && sends !== null && !sendsError && (state !== null || sendDocs.length > 0);

  return (
    <EmailDeliveryControl
      statusId={`wallet-email-status-${hackathonId}`}
      delivery={state}
      loading={loading}
      error={error}
      buckets={showCounters ? buckets : null}
      bucketsLoadingText={
        !loading && state !== null && sends === null && !sendsError
          ? "Loading email send records…"
          : null
      }
      bucketErrors={[sendsError, recipientsError]}
      countRecipients={() => countWalletEmailRecipients(hackathonId)}
      start={() => startWalletEmailDelivery(hackathonId)}
      copy={copyFor(hackathonId)}
      disabled={disabled}
      disabledReason="Save or cancel your settings changes before sending."
    />
  );
}
