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
export function BlacklistSection({
  matches,
  focusedApplicant,
  onSelect,
}: BlacklistSectionProps) {
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
      className="w-full border-b border-border"
    >
      <AccordionItem value="blacklist" className="border-0">
        <AccordionTrigger
          className={cn(
            "px-4 py-3 hover:no-underline transition-colors rounded-none",
            hasMatches
              ? "hover:bg-destructive/5 data-[state=open]:bg-destructive/5"
              : "hover:bg-muted/40 data-[state=open]:bg-muted/40",
          )}
        >
          <div className={cn("flex items-center gap-2", hasMatches && "text-destructive")}>
            <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-sm">Blacklisted</span>
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
            <div className="px-4 py-3 text-xs text-muted-foreground">
              No blacklisted applicants in this hackathon.
            </div>
          ) : (
            <ul role="list" className="flex flex-col">
              {matches.map((match) => {
                const isActive = focusedApplicant?._id === match.applicantId;
                return (
                  <li key={match.applicantId}>
                    <Button
                      variant="ghost"
                      onClick={() => onSelect(match.applicantId)}
                      className={cn(
                        "h-full w-full cursor-pointer flex-col items-start gap-0.5",
                        "rounded-none px-4 py-2.5 text-left",
                        "border-l-2 border-l-destructive/40",
                        "hover:bg-destructive/5 active:bg-destructive/10",
                        isActive && "bg-destructive/10 border-l-destructive",
                      )}
                    >
                      <span className="font-medium text-sm leading-tight text-destructive">
                        {match.applicantName || "(No name)"}
                      </span>

                      <span className="text-xs text-muted-foreground leading-tight truncate w-full">
                        {match.email}
                      </span>

                      {match.entry.bannedHackathon && (
                        <span className="text-xs text-muted-foreground leading-tight">
                          Banned:{" "}
                          <span className="font-medium">{match.entry.bannedHackathon}</span>
                        </span>
                      )}

                      {match.entry.notes && (
                        <span className="text-xs text-muted-foreground leading-snug line-clamp-2 mt-0.5 w-full">
                          {match.entry.notes}
                        </span>
                      )}
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