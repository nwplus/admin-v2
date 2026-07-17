import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Applicant, BlacklistMatch } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

interface BlacklistSectionProps {
  matches: BlacklistMatch[];
  focusedApplicant: Applicant | null;
  onSelect: (applicantId: string) => void;
}

/**
 * Collapsible accordion section rendered at the top of the ApplicantList sidebar.
 *
 * - Defaults to expanded when at least one match exists.
 * - All matches are shown regardless of the applicant's grading status.
 * - Clicking a row loads the application in the centre panel via onSelect.
 */
export function BlacklistSection({ matches, focusedApplicant, onSelect }: BlacklistSectionProps) {
  const hasMatches = matches.length > 0;
  const [openItem, setOpenItem] = useState<string | undefined>(
    hasMatches ? "blacklist" : undefined,
  );

  useEffect(() => {
    if (hasMatches) {
      setOpenItem("blacklist");
    }
  }, [hasMatches]);

  return (
    <Accordion
      type="single"
      collapsible
      value={openItem}
      onValueChange={setOpenItem}
      className="w-full border-border border-b"
    >
      <AccordionItem value="blacklist" className="border-0">
        <AccordionTrigger
          className={cn(
            "rounded-none px-3 py-2.5 transition-colors hover:no-underline",
            hasMatches
              ? "hover:bg-destructive/5 data-[state=open]:bg-destructive/5"
              : "hover:bg-muted/40 data-[state=open]:bg-muted/40",
          )}
        >
          <div className={cn("flex items-center gap-2", hasMatches && "text-destructive")}>
            <div className="flex items-center justify-center">
              <div className="flex w-10 shrink-0 items-center justify-center rounded-full p-1.5">
                <ShieldAlert className="size-4" aria-hidden="true" />
              </div>
            </div>

            <div className="flex flex-col items-start gap-0.5">
              <span className="font-medium text-sm leading-tight">Blacklisted</span>
            </div>

            <Badge
              variant={hasMatches ? "destructive" : "secondary"}
              className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-xs tabular-nums"
            >
              {matches.length}
            </Badge>
          </div>
        </AccordionTrigger>
        {/* ── Match rows ───────────────────────────────────────────── */}
        <AccordionContent className="pb-0">
          {matches.length === 0 ? (
            <div className="px-4 py-3 text-muted-foreground text-xs">
              No blacklisted applicants in this hackathon.
            </div>
          ) : (
            <ul className="flex flex-col">
              {matches.map((match) => {
                const isActive = focusedApplicant?._id === match.applicantId;
                return (
                  <li key={match.applicantId}>
                    <Button
                      variant="ghost"
                      onClick={() => onSelect(match.applicantId)}
                      className={cn(
                        "h-full w-full cursor-pointer rounded-none px-3 py-2.5 text-left",
                        "hover:bg-destructive/5 active:bg-destructive/10",
                        isActive && "bg-destructive/10",
                      )}
                    >
                      <div className="grid w-full grid-cols-[40px_1fr_auto] items-center gap-2">
                        <div className="flex items-center justify-center">
                          <div
                            className="flex shrink-0 items-center justify-center rounded-full bg-destructive/10 p-1.5"
                            title={match.entry.notes ?? "This applicant is blacklisted"}
                            aria-hidden={false}
                          >
                            <ShieldAlert className="size-4 text-destructive" />
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-0.5">
                          <div className="text-destructive text-sm">
                            {match.applicantName || "(No name)"}
                          </div>

                          <span className="w-full truncate text-muted-foreground text-xs leading-tight">
                            {match.email}
                          </span>

                          {match.entry.bannedHackathon && (
                            <span className="text-muted-foreground text-xs leading-tight">
                              Banned:{" "}
                              <span className="font-medium">{match.entry.bannedHackathon}</span>
                            </span>
                          )}

                          {match.entry.notes && (
                            <span className="mt-0.5 line-clamp-2 w-full text-muted-foreground text-xs leading-snug">
                              {match.entry.notes}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-end">
                          {/* empty for now - keeps right column aligned with applicant rows */}
                        </div>
                      </div>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
