import { WrappedEmailControl } from "@/components/features/settings/wrapped-email-control";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { uploadWrappedBanner } from "@/lib/firebase/storage";
import {
  type WrappedSettings as WrappedSettingsData,
  getDefaultWrappedUrl,
  subscribeToWrappedSettings,
  updateWrappedSettings,
} from "@/services/wrapped-email";
import { format, parseISO } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { ImageIcon, Pencil, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const BANNER_TYPES = ["image/png", "image/jpeg"];

const TIME_FIELDS = [
  {
    key: "checkInOpensAt",
    label: "Check-in Opens",
    description: "Optional. Early Bird measures from the earliest check-in when blank.",
  },
] as const;

type TimeField = (typeof TIME_FIELDS)[number]["key"];

/** Timestamp → datetime-local input value, in the browser's time zone. */
const toDateTimeLocal = (timestamp?: Timestamp) =>
  timestamp ? format(timestamp.toDate(), "yyyy-MM-dd'T'HH:mm") : "";

const toTimeDraft = (settings: WrappedSettingsData | null) =>
  Object.fromEntries(
    TIME_FIELDS.map(({ key }) => [key, toDateTimeLocal(settings?.[key])]),
  ) as Record<TimeField, string>;

/**
 * Hacker Wrapped release, check-in time, banner, and email settings stored on Hackathons/{id}.wrapped.
 * Saved independently of the InternalWebsites/Portal settings form.
 */
export function WrappedSettings({
  hackathonId,
  formBusy = false,
}: {
  hackathonId: string;
  /** True while the main settings form is being edited or saved. */
  formBusy?: boolean;
}) {
  const [settings, setSettings] = useState<WrappedSettingsData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [url, setUrl] = useState("");
  const [times, setTimes] = useState<Record<TimeField, string>>(() => toTimeDraft(null));
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [releaseConfirmOpen, setReleaseConfirmOpen] = useState(false);

  useEffect(
    () =>
      subscribeToWrappedSettings(
        hackathonId,
        (next) => {
          setSettings(next);
          setLoadError(null);
        },
        (failure) => setLoadError(`Could not load Wrapped settings: ${failure.message}`),
      ),
    [hackathonId],
  );

  const defaultUrl = getDefaultWrappedUrl(hackathonId);

  const resetDraft = () => {
    setIsReady(settings?.isReady === true);
    setUrl(settings?.url ?? "");
    setTimes(toTimeDraft(settings));
    setBannerFile(null);
    setBannerPreview(null);
    setBannerError(null);
  };

  const handleEdit = () => {
    resetDraft();
    setIsEditing(true);
  };

  const handleCancel = () => {
    resetDraft();
    setIsEditing(false);
  };

  const handleReleaseChange = (checked: boolean) => {
    if (checked) setReleaseConfirmOpen(true);
    else setIsReady(false);
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!BANNER_TYPES.includes(file.type)) {
      setBannerError("The banner must be a PNG or JPEG image.");
      return;
    }
    setBannerError(null);
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setBannerPreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!settings || isSaving) return;
    const trimmedUrl = url.trim();
    if (trimmedUrl && !/^https:\/\/\S+$/.test(trimmedUrl)) {
      toast.error("The Wrapped link must start with https://");
      return;
    }

    setIsSaving(true);
    try {
      const changes: Parameters<typeof updateWrappedSettings>[1] = {};
      if (isReady !== (settings.isReady === true)) changes.isReady = isReady;
      if (trimmedUrl !== (settings.url ?? "")) changes.url = trimmedUrl || null;
      for (const { key } of TIME_FIELDS) {
        if (times[key] !== toDateTimeLocal(settings[key])) {
          changes[key] = times[key] ? parseISO(times[key]) : null;
        }
      }
      if (bannerFile) {
        const bannerUrl = await uploadWrappedBanner(hackathonId, bannerFile);
        if (!bannerUrl) {
          toast.error("Failed to upload the Wrapped banner");
          return;
        }
        changes.bannerUrl = bannerUrl;
      }
      await updateWrappedSettings(hackathonId, changes);
      setIsEditing(false);
      setBannerFile(null);
      setBannerPreview(null);
      toast.success(`${hackathonId} Wrapped settings updated successfully`);
    } catch (error) {
      console.error("Error saving Wrapped settings:", error);
      toast.error("Failed to save Wrapped settings");
    } finally {
      setIsSaving(false);
    }
  };

  const released = isEditing ? isReady : settings?.isReady === true;
  const preview = bannerPreview ?? settings?.bannerUrl ?? null;

  return (
    <div className="flex gap-8 border-b py-8">
      <div className="w-48 flex-shrink-0 space-y-3">
        <div>
          <h3 className="font-semibold text-lg">Hacker Wrapped</h3>
          <p className="mt-1 text-muted-foreground text-sm">Saved separately from the form</p>
        </div>
        {settings && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleEdit}
                className="flex items-center gap-1"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-4">
        {loadError ? (
          <p className="text-destructive text-sm">{loadError}</p>
        ) : !settings ? (
          <p className="text-muted-foreground">Loading Wrapped settings...</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="wrappedReleased">Released</Label>
                <p className="text-muted-foreground text-sm">
                  Shows Hacker Wrapped to hackers in the portal.
                </p>
              </div>
              <Switch
                id="wrappedReleased"
                checked={released}
                onCheckedChange={handleReleaseChange}
                disabled={!isEditing || isSaving}
              />
            </div>
            {TIME_FIELDS.map(({ key, label, description }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`wrapped-${key}`}>{label}</Label>
                <Input
                  id={`wrapped-${key}`}
                  type="datetime-local"
                  value={isEditing ? times[key] : toDateTimeLocal(settings[key])}
                  onChange={(e) => setTimes({ ...times, [key]: e.target.value })}
                  disabled={!isEditing || isSaving}
                />
                <p className="text-muted-foreground text-sm">{description}</p>
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="wrappedBanner">Email Banner</Label>
              <div className="flex flex-wrap items-start gap-4">
                {preview ? (
                  <img
                    src={preview}
                    alt="Wrapped email banner preview"
                    className="h-24 max-w-xs rounded-md border object-contain"
                  />
                ) : (
                  <div className="flex h-24 w-48 items-center justify-center rounded-md border-2 border-gray-300 border-dashed bg-gray-50">
                    <ImageIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    id="wrappedBanner"
                    type="file"
                    accept={BANNER_TYPES.join(",")}
                    onChange={handleBannerSelect}
                    disabled={!isEditing || isSaving}
                  />
                  <p className="text-muted-foreground text-sm">PNG or JPEG. Uploaded on save.</p>
                  {bannerError && <p className="text-destructive text-sm">{bannerError}</p>}
                  {settings.bannerUrl ? (
                    <a
                      href={settings.bannerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block break-all text-muted-foreground text-xs underline"
                    >
                      {settings.bannerUrl}
                    </a>
                  ) : (
                    <p className="text-muted-foreground text-xs">No banner uploaded.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wrappedUrl">Wrapped Link Override</Label>
              <Input
                id="wrappedUrl"
                value={isEditing ? url : (settings.url ?? "")}
                onChange={(e) => setUrl(e.target.value)}
                disabled={!isEditing || isSaving}
                placeholder={defaultUrl}
              />
              <p className="text-muted-foreground text-sm">
                Leave blank to link hackers to {defaultUrl}.
              </p>
            </div>
            <WrappedEmailControl
              key={hackathonId}
              hackathonId={hackathonId}
              settings={settings}
              disabled={formBusy || isEditing || isSaving}
            />
          </>
        )}
      </div>
      <AlertDialog open={releaseConfirmOpen} onOpenChange={setReleaseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release Hacker Wrapped?</AlertDialogTitle>
            <AlertDialogDescription>
              Once saved, hackers can see their Wrapped in the portal. Make sure every Wrapped doc
              has been written first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setIsReady(true)}>Release</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
