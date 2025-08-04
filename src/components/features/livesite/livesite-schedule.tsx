import { ScheduleCard } from "@/components/features/schedule/schedule-card";
import { subscribeToLivesiteSettings } from "@/services/livesite";
import { subscribeToDayOf } from "@/services/schedule";
import type { HackathonDayOf } from "@/lib/firebase/types";
import { useEffect, useState } from "react";
import HackathonProvider from "@/providers/hackathon-provider";

export function LivesiteSchedule() {
  const [events, setEvents] = useState<HackathonDayOf[]>([]);
  const [activeHackathon, setActiveHackathon] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeLivesite = subscribeToLivesiteSettings((data) => {
      if (data?.activeHackathon) {
        setActiveHackathon(data.activeHackathon);
      }
      setLoading(false);
    });

    return () => unsubscribeLivesite();
  }, []);

  useEffect(() => {
    if (!activeHackathon) return;

    const unsubscribeEvents = subscribeToDayOf(activeHackathon, (events: HackathonDayOf[]) => {
      setEvents(events);
    });

    return () => unsubscribeEvents();
  }, [activeHackathon]);

  if (loading) {
    return <p className="text-muted-foreground">Loading schedule...</p>;
  }

  if (!activeHackathon) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Schedule</h2>
        <p className="text-muted-foreground">
          No active hackathon set. Please configure an active hackathon in settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">Schedule</h2>
        <span className="text-sm text-muted-foreground px-4">{activeHackathon}</span>
      </div>
      <HackathonProvider activeHackathon={activeHackathon}>
        <ScheduleCard events={events} />
      </HackathonProvider>
    </div>
  );
} 