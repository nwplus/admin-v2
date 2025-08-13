import { PageHeader } from "@/components/graphy/typo";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { subscribeToHackathons } from "@/lib/firebase/firestore";
import type { ApplicationStatus, Hackathon } from "@/lib/firebase/types";
import { toast } from "sonner";
import { updateApplicantsStatusByEmails } from "@/services/status-changer";
import { getAdminFlags } from "@/services/evaluator";
import { isValidEmail } from "@/lib/utils";

export const Route = createFileRoute("/_auth/status-changer")({
  component: StatusChangerPage,
});

const APPLICATION_STATUSES: ApplicationStatus[] = [
  "inProgress",
  "applied",
  "gradinginprog",
  "waitlisted",
  "scored",
  "rejected",
  "completed",
  "acceptedNoResponseYet",
  "acceptedAndAttending",
  "acceptedUnRSVP",
];

function StatusChangerPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | "">("");
  const [emailsText, setEmailsText] = useState<string>("");
  const [commaSeparated, setCommaSeparated] = useState<boolean>(true);
  const [lineSeparated, setLineSeparated] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showValidation, setShowValidation] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToHackathons((h) => setHackathons(h));
    return () => unsub();
  }, []);

  /**
   * Preselect active hackathon from CMS (InternalWebsites/CMS)
   */
  useEffect(() => {
    if (selectedHackathon) return;
    (async () => {
      try {
        const cms = await getAdminFlags();
        if (cms?.activeHackathon) {
          setSelectedHackathon(cms.activeHackathon);
        }
      } catch (e) {
        // falls back to manual selection
      }
    })();
  }, [selectedHackathon]);

  const parsedEmails = useMemo(() => {
    const text = emailsText.trim();
    if (!text) return [] as string[];

    let tokens: string[] = [];
    if (commaSeparated) tokens = tokens.concat(text.split(","));
    if (lineSeparated) tokens = tokens.concat(text.split(/\r?\n/));

    if (!commaSeparated && !lineSeparated) {
      tokens = text.split(/[\s,\r\n]+/);
    }

    return Array.from(new Set(tokens.map((t) => t.trim()).filter(Boolean)));
  }, [emailsText, commaSeparated, lineSeparated]);

  const firstInvalidEmail = useMemo(() => {
    for (const email of parsedEmails) {
      if (!isValidEmail(email)) return email;
    }
    return "";
  }, [parsedEmails]);

  const canSubmit =
    selectedHackathon &&
    selectedStatus &&
    parsedEmails.length > 0 &&
    !isSubmitting &&
    (!showValidation || firstInvalidEmail === "");

  const handleSubmit = async () => {
    setShowValidation(true);
    if (firstInvalidEmail) {
      return;
    }
    if (!selectedHackathon || !selectedStatus || parsedEmails.length === 0) return;

    setIsSubmitting(true);
    try {
      const result = await updateApplicantsStatusByEmails(
        selectedHackathon,
        parsedEmails,
        selectedStatus as ApplicationStatus,
      );

      if (result.updatedCount > 0) {
        toast.success(`Updated ${result.updatedCount} applicant(s).`);
      }
      if (result.notFoundEmails.length > 0) {
        toast.warning(`Not found: ${result.notFoundEmails.join(", ")}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update applicants. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <PageHeader>Status Changer</PageHeader>
      <Card className="w-full p-6">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <Label className="font-semibold text-xl">Choose a Hackathon:</Label>
            <Select value={selectedHackathon} onValueChange={setSelectedHackathon}>
              <SelectTrigger className="w-[210px]">
                <SelectValue placeholder="Select hackathon..." />
              </SelectTrigger>
              <SelectContent align="start">
                {hackathons.map((h) => (
                  <SelectItem key={h._id} value={h._id}>
                    {h._id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="font-semibold text-xl">Choose a Status:</Label>
            <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as ApplicationStatus)}>
              <SelectTrigger className="w-[210px]">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent align="start">
                {APPLICATION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3">
            <Label className="font-semibold text-xl">Enter emails:</Label>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox id="comma" checked={commaSeparated} onCheckedChange={(v) => setCommaSeparated(Boolean(v))} />
                <Label htmlFor="comma" className="text-gray-600">separate by comma</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="line" checked={lineSeparated} onCheckedChange={(v) => setLineSeparated(Boolean(v))} />
                <Label htmlFor="line" className="text-gray-600">separate by newline</Label>
              </div>
            </div>
            <Textarea
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
              placeholder="e.g. alvin.kam.33@gmail.com, heyitsme@hotmail.com..."
              className="min-h-[220px] max-w-3xl"
            />
            {showValidation && firstInvalidEmail && (
              <div className="text-red-600 text-sm">Invalid email: {firstInvalidEmail}</div>
            )}
            <div className="text-gray-500 text-xs">Parsed {parsedEmails.length} email(s)</div>
          </div>

          <div>
            <Button onClick={handleSubmit} disabled={!canSubmit} className="mt-2">
              {isSubmitting ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}