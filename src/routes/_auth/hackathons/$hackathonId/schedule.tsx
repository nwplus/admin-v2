import { EventDialog } from "@/components/features/schedule/event-dialog";
import { ScheduleCard } from "@/components/features/schedule/schedule-card";
import { PageHeader } from "@/components/graphy/typo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HackathonDayOf } from "@/lib/firebase/types";
import { useHackathon } from "@/providers/hackathon-provider";
import { subscribeToDayOf } from "@/services/schedule";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_auth/hackathons/$hackathonId/schedule")({
  component: ScheduleComponent,
});

function ScheduleComponent() {
  const { activeHackathon } = useHackathon();

  const [events, setEvents] = useState<HackathonDayOf[]>([]);
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!activeHackathon) return;

    const unsubQuestions = subscribeToDayOf(activeHackathon, (events: HackathonDayOf[]) => {
      setEvents(events);
    });

    return () => unsubQuestions();
  }, [activeHackathon]);

  return (
    <>
      <div className="flex h-full w-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <PageHeader className="flex items-center gap-3">
            Schedule
            <Badge variant="secondary">{activeHackathon}</Badge>
          </PageHeader>
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Add Event
          </Button>
        </div>
        <ScheduleCard events={events} />
      </div>
      <EventDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
