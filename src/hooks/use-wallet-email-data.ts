import type { WalletEmailDelivery, WalletEmailSend } from "@/lib/firebase/types";
import {
  subscribeToWalletEmailDelivery,
  subscribeToWalletEmailRecipients,
  subscribeToWalletEmailSends,
} from "@/services/wallet-email";
import { useEffect, useState } from "react";

export interface WalletEmailData {
  delivery: WalletEmailDelivery | null;
  loading: boolean;
  error: string | null;
  sends: WalletEmailSend[] | null;
  sendsError: string | null;
  recipientUids: string[] | null;
  recipientsError: string | null;
}

/**
 * Shares the wallet email delivery, send, and recipient subscriptions between the
 * wallet settings section and the email control so only one listener set is opened.
 */
export function useWalletEmailData(hackathonId: string): WalletEmailData {
  const [delivery, setDelivery] = useState<WalletEmailDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sends, setSends] = useState<WalletEmailSend[] | null>(null);
  const [sendsError, setSendsError] = useState<string | null>(null);
  const [recipientUids, setRecipientUids] = useState<string[] | null>(null);
  const [recipientsError, setRecipientsError] = useState<string | null>(null);

  useEffect(() => {
    setDelivery(null);
    setLoading(true);
    setError(null);
    setSends(null);
    setRecipientUids(null);
    setSendsError(null);
    setRecipientsError(null);

    const unsubscribe = subscribeToWalletEmailDelivery(
      hackathonId,
      (next) => {
        setDelivery(next);
        setLoading(false);
        setError(null);
      },
      (failure) => {
        setError(`Could not load wallet email status: ${failure.message}`);
        setLoading(false);
      },
    );
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

    return () => {
      unsubscribe();
      unsubscribeSends();
      unsubscribeRecipients();
    };
  }, [hackathonId]);

  return { delivery, loading, error, sends, sendsError, recipientUids, recipientsError };
}
