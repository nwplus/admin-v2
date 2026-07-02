import { STATUS_LABEL } from "@/components/features/evaluator/applicant-status";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import type { Applicant, ApplicationStatus } from "@/lib/firebase/types";
import { useEvaluator } from "@/providers/evaluator-provider";
import { useMemo, useState } from "react";
import { AcceptDialog } from "./accept-dialog";
import { ApplicantEntry } from "./applicant-entry";
import { BlacklistSection } from "./blacklist-section";
import { CalculateDialog } from "./calculate-dialog";
import { ExportDialog } from "./export-dialog";

const EVALUATOR_STATUSES: ApplicationStatus[] = ["applied", "gradinginprog", "scored"];
const APPLICATION_STATUS_OPTIONS = EVALUATOR_STATUSES.map((status) => ({
  label: STATUS_LABEL[status]?.label || status,
  value: status,
}));

export function ApplicantList() {
  const {
    applicants,
    focusedApplicant,
    setFocusedApplicant,
    blacklistMatches,
  } = useEvaluator();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<ApplicationStatus[]>([]);

  /** O(1) look-ups: is this applicant blacklisted? */
  const blacklistedIds = useMemo(
    () => new Set(blacklistMatches.map((m) => m.applicantId)),
    [blacklistMatches],
  );

  const filteredApplicants = useMemo(() => {
    let list = applicants || [];
    list = filterApplicantsByStatus(list, selectedStatuses);
    return filterApplicantsBySearch(list, searchTerm)
      .slice()
      .sort((a, b) => {
        const aMs = a.submission?.submittedAt?.toMillis?.() ?? 0;
        const bMs = b.submission?.submittedAt?.toMillis?.() ?? 0;
        if (aMs !== bMs) return aMs - bMs;
        return a._id.localeCompare(b._id);
      });
  }, [applicants, searchTerm, selectedStatuses]);

  const handleBlacklistSelect = (applicantId: string) => {
    const applicant = applicants?.find((a) => a._id === applicantId) ?? null;
    setFocusedApplicant?.(
      focusedApplicant?._id === applicantId ? null : applicant,
    );
  };

  return (
    <Card className="sticky top-[2vh] max-h-[96vh] rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="pb-2">Applicant list</CardTitle>
          <div className="flex items-center gap-2">
            <MultiSelect
              options={APPLICATION_STATUS_OPTIONS}
              selected={selectedStatuses}
              onChange={(vals) => setSelectedStatuses(vals as ApplicationStatus[])}
              placeholder="Filter by..."
              className="w-32"
            />
            <ExportDialog />
          </div>
        </div>
        <Input
          value={searchTerm ?? ""}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by ID, name, email, phone..."
        />
      </CardHeader>

      <CardContent className="overflow-auto p-0">
        {/* Blacklist section sits above the main list */}
        <BlacklistSection
          matches={blacklistMatches}
          focusedApplicant={focusedApplicant}
          onSelect={handleBlacklistSelect}
        />

        <div className="flex flex-col">
          {filteredApplicants?.map((applicant, index) => (
            <ApplicantEntry
              key={applicant._id}
              id={applicant._id}
              index={index}
              status={applicant.status}
              score={applicant.score}
              onSelect={() =>
                setFocusedApplicant?.(
                  focusedApplicant?._id === applicant._id ? null : applicant,
                )
              }
              isActive={focusedApplicant?._id === applicant._id}
              disabled={blacklistedIds.has(applicant._id)}
            />
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex gap-3">
        <CalculateDialog />
        <AcceptDialog />
      </CardFooter>
    </Card>
  );
}

// ── Helpers (unchanged) ───────────────────────────────────────────────────────

export const filterApplicantsBySearch = (
  applicants: Applicant[],
  searchTerm: string,
): Applicant[] => {
  if (!searchTerm.trim()) return applicants;
  const normalizedSearch = searchTerm.toLowerCase().trim();
  const searchWords = normalizedSearch.split(/\s+/);
  return applicants.filter((applicant) => {
    if (!applicant.basicInfo) return false;
    const { firstName, lastName, email, phoneNumber } = applicant.basicInfo;
    const fields = [
      applicant._id?.toLowerCase() || "",
      firstName?.toLowerCase() || "",
      lastName?.toLowerCase() || "",
      email?.toLowerCase() || "",
      phoneNumber?.toLowerCase() || "",
    ];
    return searchWords.every((word) => fields.some((field) => field.includes(word)));
  });
};

const filterApplicantsByStatus = (
  applicants: Applicant[],
  statuses: ApplicationStatus[],
): Applicant[] => {
  if (!statuses.length) return applicants;
  const wanted = new Set(statuses);
  return applicants.filter(
    (a) => a.status?.applicationStatus && wanted.has(a.status.applicationStatus),
  );
};