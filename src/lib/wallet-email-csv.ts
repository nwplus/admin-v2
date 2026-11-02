import type { WalletEmailSend } from "@/lib/firebase/types";
import type { WalletEmailRecipient } from "@/services/wallet-email";
import type { Timestamp } from "firebase/firestore";

const CSV_COLUMNS = [
  "uid",
  "email",
  "status",
  "attempts",
  "lastAttemptedAt",
  "sentAt",
  "updatedAt",
  "error",
  "batchId",
  "sentBy",
] as const;

const escapeCsvField = (value: unknown): string => {
  if (value === undefined || value === null) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const formatTimestampValue = (value?: Timestamp): string =>
  value ? value.toDate().toISOString() : "";

/**
 * Builds the wallet email CSV with one row per accepted and attending applicant.
 * Applicants without an email send record are reported as `notSent`.
 */
export function buildWalletEmailCsv(
  recipients: WalletEmailRecipient[],
  sends: WalletEmailSend[],
): string {
  const sendsByUid = new Map(sends.map((send) => [send.uid, send]));
  const rows = recipients.map((recipient) => {
    const send = sendsByUid.get(recipient.uid);
    return [
      recipient.uid,
      send?.email ?? recipient.email ?? "",
      send?.status ?? "notSent",
      send?.attempts ?? 0,
      formatTimestampValue(send?.lastAttemptedAt),
      formatTimestampValue(send?.sentAt),
      formatTimestampValue(send?.updatedAt),
      send?.error ?? "",
      send?.batchId ?? "",
      send?.sentBy ?? "",
    ];
  });

  return [CSV_COLUMNS, ...rows].map((row) => row.map(escapeCsvField).join(",")).join("\n");
}
