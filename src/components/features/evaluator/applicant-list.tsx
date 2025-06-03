import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Applicant } from "@/lib/firebase/types";
import { useEvaluator } from "@/providers/evaluator-provider";
import { useMemo, useState } from "react";
import { AcceptDialog } from "./accept-dialog";
import { ApplicantEntry } from "./applicant-entry";
import { CalculateDialog } from "./calculate-dialog";

export function ApplicantList() {
  const { applicants, focusedApplicant, setFocusedApplicant } = useEvaluator();
  const [searchTerm, setSearchTerm] = useState("");

  // using a useMemo for later when adding debounce
  const filteredApplicants = useMemo(() => {
    return filterApplicantsBySearch(applicants || [], searchTerm);
  }, [applicants, searchTerm]);

  return (
    <Card className="sticky top-[2vh] max-h-[96vh]">
      <CardHeader>
        <CardTitle className="pb-2">Applicant list</CardTitle>
        <Input
          value={searchTerm ?? ""}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
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
      firstName?.toLowerCase() || "",
      lastName?.toLowerCase() || "",
      email?.toLowerCase() || "",
      phoneNumber?.toLowerCase() || "",
    ];

    // Check if all search words match at least one field
    return searchWords.every((word) => fields.some((field) => field.includes(word)));
  });
};
