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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWalletEmailData } from "@/hooks/use-wallet-email-data";
import { chunkArray, downloadCSV } from "@/lib/utils";
import { buildWalletEmailCsv } from "@/lib/wallet-email-csv";
import { getWalletEmailRecipients } from "@/services/wallet-email";
import { generateAppleWalletPasses } from "@/services/wallet-passes";
import { format } from "date-fns/format";
import { AlertTriangle, Download, LoaderCircle, WalletCards } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WalletEmailControl } from "./wallet-email-control";

const APPLE_PASS_CHUNK_SIZE = 25;

interface WalletSettingsSectionProps {
  hackathonId: string;
  walletAvailable: boolean;
  isEditing: boolean;
  isSaving: boolean;
  onWalletAvailableChange: (checked: boolean) => void;
}

interface GenerationProgress {
  processed: number;
  total: number;
  generated: number;
}

export function WalletSettingsSection({
  hackathonId,
  walletAvailable,
  isEditing,
  isSaving,
  onWalletAvailableChange,
}: WalletSettingsSectionProps) {
  const data = useWalletEmailData(hackathonId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [failures, setFailures] = useState<{ uid: string; error: string }[]>([]);

  const settingsBusy = isEditing || isSaving;
  const dataLoaded =
    data.sends !== null && data.recipientUids !== null && !data.sendsError && !data.recipientsError;

  const handleGenerate = async () => {
    if (generating || settingsBusy) return;
    setConfirmOpen(false);
    setGenerating(true);
    setProgress({ processed: 0, total: 0, generated: 0 });
    setFailures([]);

    try {
      const recipients = await getWalletEmailRecipients(hackathonId);
      const uids = recipients.map((recipient) => recipient.uid);
      let processed = 0;
      let generated = 0;
      const failed: { uid: string; error: string }[] = [];
      setProgress({ processed, total: uids.length, generated });

      for (const chunk of chunkArray(uids, APPLE_PASS_CHUNK_SIZE)) {
        const result = await generateAppleWalletPasses(hackathonId, chunk);
        processed += chunk.length;
        generated += result.generated;
        failed.push(...result.failed);
        setProgress({ processed, total: uids.length, generated });
        setFailures([...failed]);
      }

      const noun = generated === 1 ? "pass" : "passes";
      if (failed.length > 0) {
        toast.error(`Generated ${generated} Apple ${noun}; ${failed.length} failed`);
      } else {
        toast.success(`Generated ${generated} Apple ${noun}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate Apple passes");
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!data.sends || !data.recipientUids || exporting) return;
    setExporting(true);
    try {
      const recipients = await getWalletEmailRecipients(hackathonId);
      const csv = buildWalletEmailCsv(recipients, data.sends);
      const date = format(new Date(), "yyyy-MM-dd");
      downloadCSV(csv, `wallet-email-${hackathonId}-${date}.csv`);
      toast.success("Wallet email CSV exported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export wallet email CSV");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex gap-8 border-b py-8">
      <div className="w-48 flex-shrink-0">
        <h3 className="font-semibold text-lg">Wallet</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          Apple Wallet passes and wallet emails for attending hackers.
        </p>
      </div>
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="walletAvailable">Wallet Available</Label>
            <p className="mt-1 text-muted-foreground text-sm">
              Shows the Add to Apple/Google Wallet buttons on hacker tickets
            </p>
          </div>
          <Switch
            id="walletAvailable"
            checked={walletAvailable}
            onCheckedChange={onWalletAvailableChange}
            disabled={!isEditing}
          />
        </div>

        {!walletAvailable && (
          <Alert>
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>Wallet is turned off</AlertTitle>
            <AlertDescription>
              Add to Apple/Google Wallet buttons are hidden on hacker tickets. Wallet emails and
              email links still work.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Apple Wallet passes</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setConfirmOpen(true)}
              disabled={settingsBusy || generating}
            >
              {generating ? (
                <LoaderCircle
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <WalletCards className="h-4 w-4" aria-hidden="true" />
              )}
              {generating ? "Generating Apple passes…" : "Generate / regenerate Apple passes"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={!dataLoaded || exporting}
            >
              {exporting ? (
                <LoaderCircle
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              Export CSV
            </Button>
          </div>
          {progress && (
            <output aria-live="polite" className="block text-muted-foreground text-xs">
              {generating ? "Generating" : "Finished"} {progress.processed} of {progress.total}{" "}
              processed · {progress.generated} generated
              {failures.length > 0 ? ` · ${failures.length} failed` : ""}
            </output>
          )}
          {failures.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-md border p-2">
              <ul className="space-y-1 font-mono text-xs">
                {failures.map((failure, index) => (
                  <li key={`${failure.uid}-${index}`} className="break-all">
                    {failure.uid}: {failure.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Wallet emails</Label>
          <WalletEmailControl
            key={hackathonId}
            hackathonId={hackathonId}
            disabled={settingsBusy}
            data={data}
          />
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Apple passes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate or regenerate Apple Wallet passes for every applicant marked
              accepted and attending, in batches of {APPLE_PASS_CHUNK_SIZE}. It may take a few
              minutes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={generating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerate} disabled={settingsBusy || generating}>
              Generate passes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
