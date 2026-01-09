import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
  HackathonBooleanMap,
  HackathonConfig,
  HackathonConfigMap,
  NotionLinksMap,
  WaiversAndFormsMap,
} from "@/lib/firebase/types";
import { formatTimestamp, getHackathonType, splitHackathon } from "@/lib/utils";
import { subscribeToHackathonConfig, updateHackathonConfig } from "@/services/hackathon-settings";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import { Pencil, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Settings form for a specific hackathon
 */
export function HackathonSettingsForm({ hackathonId }: { hackathonId: string }) {
  const [config, setConfig] = useState<HackathonConfig | null>(null);
  const [editedConfig, setEditedConfig] = useState<HackathonConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hackathonType = getHackathonType(hackathonId);

  useEffect(() => {
    const unsubscribe = subscribeToHackathonConfig((data) => {
      setConfig(data);
      setEditedConfig(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEdit = () => {
    setEditedConfig(config);
    setIsEditing(true);
  };

  /**
   * Validates that start times are before end times for both hackathon and hacking periods
   */
  const validateTimeRanges = (
    config: HackathonConfig,
  ): { isValid: boolean; errorMessage?: string } => {
    const hackathonStart = (config.hackathonStart as HackathonConfigMap)[hackathonType];
    const hackathonEnd = (config.hackathonEnd as HackathonConfigMap)[hackathonType];
    const hackingStart = (config.hackingStart as HackathonConfigMap)[hackathonType];
    const hackingEnd = (config.hackingEnd as HackathonConfigMap)[hackathonType];

    if (!hackathonStart || !hackathonEnd || !hackingStart || !hackingEnd) {
      return { isValid: false, errorMessage: "Event timeline must be filled in" };
    }

    const hackathonStartTime = new Date(hackathonStart);
    const hackathonEndTime = new Date(hackathonEnd);
    const hackingStartTime = new Date(hackingStart);
    const hackingEndTime = new Date(hackingEnd);

    // Validate hackathon start < hackathon end
    if (hackathonStartTime >= hackathonEndTime) {
      return {
        isValid: false,
        errorMessage: "Hackathon start time must be before hackathon end time",
      };
    }

    // Validate hacking start < hacking end
    if (hackingStartTime >= hackingEndTime) {
      return {
        isValid: false,
        errorMessage: "Hacking start time must be before hacking end time",
      };
    }

    return { isValid: true };
  };

  const handleSave = async () => {
    if (!editedConfig) return;

    const validation = validateTimeRanges(editedConfig);
    if (!validation.isValid) {
      toast.error(validation.errorMessage || "Invalid time configuration");
      return;
    }

    setIsSaving(true);
    try {
      await updateHackathonConfig(editedConfig);
      setIsEditing(false);
      toast.success(`${hackathonId} settings updated successfully`);
    } catch (error) {
      console.error("Error saving hackathon settings:", error);
      toast.error("Failed to save hackathon settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedConfig(config);
    setIsEditing(false);
  };

  /**
   * Generic handler for edited HackathonConfig fields
   * @param field - field to edit
   * @param value - value to set the field to
   * @param nestedField - nested field to edit i.e. notionLinks.preHackathonWorkshops
   */
  const handleFieldChange = (
    field: keyof HackathonConfig,
    value: string | boolean,
    nestedField?: string,
  ) => {
    if (!editedConfig) return;

    let processedValue = value;
    if (
      typeof value === "string" &&
      ["hackathonStart", "hackathonEnd", "hackingStart", "hackingEnd"].includes(field)
    ) {
      processedValue = value ? new Date(`${value}:00`).toISOString() : "";
    }

    const currentValue = editedConfig[field];
    const isMapField =
      typeof currentValue === "object" && currentValue !== null && !Array.isArray(currentValue);

    if (nestedField) {
      const hackathonValue =
        (currentValue as HackathonConfigMap | WaiversAndFormsMap | NotionLinksMap)?.[
          hackathonType
        ] || {};
      const updatedMap = {
        ...(currentValue as object),
        [hackathonType]: {
          ...hackathonValue,
          [nestedField]: processedValue,
        },
      };
      setEditedConfig({ ...editedConfig, [field]: updatedMap as unknown as typeof currentValue });
    } else if (isMapField) {
      const updatedMap = { ...(currentValue as object), [hackathonType]: processedValue };
      setEditedConfig({ ...editedConfig, [field]: updatedMap as unknown as typeof currentValue });
    } else {
      setEditedConfig({
        ...editedConfig,
        [field]: processedValue as unknown as typeof currentValue,
      });
    }
  };

  const currentConfig = isEditing ? editedConfig : config;

  /**
   * Convert ISO string to datetime-local format for HTML input
   */
  const toDateTimeLocalFormat = (isoString: string): string => {
    return isoString ? format(parseISO(isoString), "yyyy-MM-dd'T'HH:mm") : "";
  };

  /**
   * Generic getter for hackathon-specific values
   * @param field - field to get the value of
   * @param nestedField - nested field to get the value of i.e. notionLinks.preHackathonWorkshops
   * @returns value of the field or empty string if not found
   */
  const getValue = (field: keyof HackathonConfig, nestedField?: string): string => {
    const value = currentConfig?.[field];
    const isMapField = typeof value === "object" && value !== null && !Array.isArray(value);

    if (nestedField) {
      // Need to cast to corresponding maps to avoid type errors
      const hackathonValue = (value as WaiversAndFormsMap | NotionLinksMap)?.[hackathonType];
      return hackathonValue?.[nestedField as keyof typeof hackathonValue] ?? "";
    }
    if (isMapField) {
      return (value as HackathonConfigMap)[hackathonType] ?? "";
    }
    return (value as string) ?? "";
  };

  /**
   * Generic getter for boolean values corresponding to toggle fields
   */
  const getBooleanValue = (field: keyof HackathonConfig): boolean => {
    const value = currentConfig?.[field];
    const isMapField = typeof value === "object" && value !== null && !Array.isArray(value);

    if (isMapField) {
      return (value as HackathonBooleanMap)[hackathonType] ?? false;
    }
    return typeof value === "boolean" ? value : false;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-xl">{splitHackathon(hackathonId).join(" ")} Settings</h2>
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
            <Button size="sm" onClick={handleEdit} className="flex items-center gap-1">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {config && (
        <p className="text-muted-foreground text-sm">
          Last edited by {config.lastEditedBy || "Unknown"} on {formatTimestamp(config.lastEdited)}
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading settings...</p>
      ) : !currentConfig ? (
        <p className="text-muted-foreground">No settings found.</p>
      ) : (
        <div className="rounded-lg border p-6">
          <div className="flex gap-8 border-b pb-8">
            <div className="w-48 flex-shrink-0">
              <h3 className="font-semibold text-lg">General Information</h3>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hackathonWeekend">Hackathon Weekend</Label>
                <Input
                  id="hackathonWeekend"
                  value={getValue("hackathonWeekend")}
                  onChange={(e) => handleFieldChange("hackathonWeekend", e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., March 8-9"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="portalLive">Portal Live</Label>
                <Switch
                  id="portalLive"
                  checked={getBooleanValue("portalLive")}
                  onCheckedChange={(checked) => handleFieldChange("portalLive", checked)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-8 border-b py-8">
            <div className="w-48 flex-shrink-0">
              <h3 className="font-semibold text-lg">Hacker Application Status</h3>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="applicationsOpen">Applications Open</Label>
                <Switch
                  id="applicationsOpen"
                  checked={getBooleanValue("applicationsOpen")}
                  onCheckedChange={(checked) => handleFieldChange("applicationsOpen", checked)}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="rsvpOpen">RSVP Open</Label>
                <Switch
                  id="rsvpOpen"
                  checked={getBooleanValue("rsvpOpen")}
                  onCheckedChange={(checked) => handleFieldChange("rsvpOpen", checked)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicationDeadline">Application Deadline</Label>
                <Input
                  id="applicationDeadline"
                  value={getValue("applicationDeadline")}
                  onChange={(e) => handleFieldChange("applicationDeadline", e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., March 5th, 2025 at 11:59 PM (Pacific Time)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsvpBy">RSVP By</Label>
                <Input
                  id="rsvpBy"
                  value={getValue("rsvpBy")}
                  onChange={(e) => handleFieldChange("rsvpBy", e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., March 5th at 11:59 PM (Pacific Time)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waitlistSignupDeadline">Waitlist Signup Deadline</Label>
                <Input
                  id="waitlistSignupDeadline"
                  value={getValue("waitlistSignupDeadline")}
                  onChange={(e) => handleFieldChange("waitlistSignupDeadline", e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., March 2nd at 11:59 PM (Pacific Time)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="offWaitlistNotify">Off Waitlist Notify</Label>
                <Input
                  id="offWaitlistNotify"
                  value={getValue("offWaitlistNotify")}
                  onChange={(e) => handleFieldChange("offWaitlistNotify", e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., March 2nd at 11:59 PM (Pacific Time)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sendAcceptancesBy">Send Acceptances By</Label>
                <Input
                  id="sendAcceptancesBy"
                  value={getValue("sendAcceptancesBy")}
                  onChange={(e) => handleFieldChange("sendAcceptancesBy", e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., late February"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-8 border-b py-8">
            <div className="w-48 flex-shrink-0">
              <h3 className="font-semibold text-lg">Event Timeline</h3>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hackathonStart">Hackathon Start</Label>
                <Input
                  id="hackathonStart"
                  value={toDateTimeLocalFormat(getValue("hackathonStart"))}
                  onChange={(e) => handleFieldChange("hackathonStart", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter hackathon start time"
                  type="datetime-local"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hackathonEnd">Hackathon End</Label>
                <Input
                  id="hackathonEnd"
                  value={toDateTimeLocalFormat(getValue("hackathonEnd"))}
                  onChange={(e) => handleFieldChange("hackathonEnd", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter hackathon end time"
                  type="datetime-local"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hackingStart">Hacking Start</Label>
                <Input
                  id="hackingStart"
                  value={toDateTimeLocalFormat(getValue("hackingStart"))}
                  onChange={(e) => handleFieldChange("hackingStart", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter hacking start time"
                  type="datetime-local"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hackingEnd">Hacking End</Label>
                <Input
                  id="hackingEnd"
                  value={toDateTimeLocalFormat(getValue("hackingEnd"))}
                  onChange={(e) => handleFieldChange("hackingEnd", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter hacking end time"
                  type="datetime-local"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-8 border-b py-8">
            <div className="w-48 flex-shrink-0">
              <div>
                <h3 className="font-semibold text-lg">Judging & Submissions</h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  (Peer) judging is currently only supported for Hackcamp
                </p>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="submissionsOpen">Submissions Open</Label>
                <Switch
                  id="submissionsOpen"
                  checked={getBooleanValue("submissionsOpen")}
                  onCheckedChange={(checked) => handleFieldChange("submissionsOpen", checked)}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="judgingOpen">Judging Open</Label>
                <Switch
                  id="judgingOpen"
                  checked={getBooleanValue("judgingOpen")}
                  onCheckedChange={(checked) => handleFieldChange("judgingOpen", checked)}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="judgingReleased">Judging Released</Label>
                <Switch
                  id="judgingReleased"
                  checked={getBooleanValue("judgingReleased")}
                  onCheckedChange={(checked) => handleFieldChange("judgingReleased", checked)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-8 border-b py-8">
            <div className="w-48 flex-shrink-0">
              <h3 className="font-semibold text-lg">Notion Links</h3>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preHackathonWorkshops">Pre-Hackathon Workshops</Label>
                <Input
                  id="preHackathonWorkshops"
                  value={getValue("notionLinks", "preHackathonWorkshops")}
                  onChange={(e) =>
                    handleFieldChange("notionLinks", e.target.value, "preHackathonWorkshops")
                  }
                  disabled={!isEditing}
                  placeholder="Enter Notion link for pre-hackathon workshops"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hackerPackageIFrame">Hacker Package IFrame</Label>
                <div className="text-muted-foreground text-sm">
                  <p>1. Publish the hacker package</p>
                  <p>2. Click site settings → Publish tab → Embed this page</p>
                  <p>3. Disable "Show page header"</p>
                  <p>4. Copy code</p>
                </div>
                <Input
                  id="hackerPackageIFrame"
                  value={getValue("notionLinks", "hackerPackageIFrame")}
                  onChange={(e) =>
                    handleFieldChange("notionLinks", e.target.value, "hackerPackageIFrame")
                  }
                  disabled={!isEditing}
                  placeholder="Enter Notion embed code for hacker package"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-8 pt-8">
            <div className="w-48 flex-shrink-0">
              <h3 className="font-semibold text-lg">Waivers & Forms</h3>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="covid">COVID Waiver</Label>
                <Textarea
                  id="covid"
                  value={getValue("waiversAndForms", "covid")}
                  onChange={(e) => handleFieldChange("waiversAndForms", e.target.value, "covid")}
                  disabled={!isEditing}
                  placeholder="Enter COVID waiver link"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="media">Media Release</Label>
                <Textarea
                  id="media"
                  value={getValue("waiversAndForms", "media")}
                  onChange={(e) => handleFieldChange("waiversAndForms", e.target.value, "media")}
                  disabled={!isEditing}
                  placeholder="Enter media release link"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nwMentorship">nwPlus Mentorship</Label>
                <Textarea
                  id="nwMentorship"
                  value={getValue("waiversAndForms", "nwMentorship")}
                  onChange={(e) =>
                    handleFieldChange("waiversAndForms", e.target.value, "nwMentorship")
                  }
                  disabled={!isEditing}
                  placeholder="Enter nwPlus mentorship link"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="releaseLiability">Release Liability</Label>
                <Textarea
                  id="releaseLiability"
                  value={getValue("waiversAndForms", "releaseLiability")}
                  onChange={(e) =>
                    handleFieldChange("waiversAndForms", e.target.value, "releaseLiability")
                  }
                  disabled={!isEditing}
                  placeholder="Enter release liability link"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
