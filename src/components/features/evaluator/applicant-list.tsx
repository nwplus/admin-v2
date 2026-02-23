import { STATUS_LABEL } from "@/components/features/evaluator/applicant-status";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import type { Applicant } from "@/lib/firebase/types";
import type { ApplicationStatus } from "@/lib/firebase/types";
import { useEvaluator } from "@/providers/evaluator-provider";
import { useMemo, useState } from "react";
import { AcceptDialog } from "./accept-dialog";
import { ApplicantEntry } from "./applicant-entry";
import { CalculateDialog } from "./calculate-dialog";
import { ExportDialog } from "./export-dialog";

const EVALUATOR_STATUSES: ApplicationStatus[] = ["applied", "gradinginprog", "scored"];
const APPLICATION_STATUS_OPTIONS = EVALUATOR_STATUSES.map((status) => ({
  label: STATUS_LABEL[status]?.label || status,
  value: status,
}));

export function ApplicantList() {
  const { applicants, focusedApplicant, setFocusedApplicant } = useEvaluator();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<ApplicationStatus[]>([]);

  // using a useMemo for later when adding debounce
  const filteredApplicants = useMemo(() => {
    let list = applicants || [];
    list = filterApplicantsByStatus(list, selectedStatuses);
    return filterApplicantsBySearch(list, searchTerm).sort((a, b) => a._id.localeCompare(b._id));
  }, [applicants, searchTerm, selectedStatuses]);

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
        <div className="flex flex-col">
          {filteredApplicants?.map((applicant, index) => (
            <ApplicantEntry
              key={applicant._id}
              id={applicant._id}
              index={index}
              status={applicant.status}
              score={applicant.score}
              onSelect={() =>
                setFocusedApplicant?.(focusedApplicant?._id === applicant._id ? null : applicant)
              }
              isActive={focusedApplicant?._id === applicant._id}
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

    // Check if all search words match at least one field
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
