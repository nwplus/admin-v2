import { Card } from "@/components/ui/card";
import type { HackathonDayOf } from "@/lib/firebase/types";
import { isValidISODateString } from "@/lib/utils";
import {
  addDays,
  differenceInDays,
  format,
  getHours,
  getMinutes,
  isSameDay,
  startOfDay,
} from "date-fns";
import { useState } from "react";
import { EventDialog } from "./event-dialog";

interface DayEvent {
  date: Date;
  events: EventWithPosition[];
}

interface EventWithPosition extends HackathonDayOf {
  startPosition: number; // minutes from start of day
  duration: number; // duration in minutes
  top: number; // percentage from top
  height: number; // percentage height
}

interface WeekCalendarData {
  days: DayEvent[];
  canDisplay: boolean;
  totalDays: number;
  startHour: number;
  endHour: number;
  timeSlots: number[];
}

function parseEventsToWeekCalendar(events: HackathonDayOf[]): WeekCalendarData {
  const validEvents = events.filter(
    (event) => isValidISODateString(event.startTime) && isValidISODateString(event.endTime),
  );

  if (validEvents.length === 0) {
    return { days: [], canDisplay: true, totalDays: 0, startHour: 0, endHour: 24, timeSlots: [] };
  }

  // Extract all unique dates and time bounds
  const dateSet = new Set<string>();
  let earliestHour = 24;
  let latestHour = 0;

  for (const event of validEvents) {
    const startDate = new Date(event.startTime as string);
    const endDate = new Date(event.endTime as string);

    // Update time bounds
    const startHour = getHours(startDate);
    const endHour = getHours(endDate) + (getMinutes(endDate) > 0 ? 1 : 0);

    earliestHour = Math.min(earliestHour, startHour);
    latestHour = Math.max(latestHour, endHour);

    // Add all dates between start and end (inclusive)
    const daysDiff = differenceInDays(startOfDay(endDate), startOfDay(startDate));
    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = addDays(startOfDay(startDate), i);
      dateSet.add(currentDate.toISOString());
    }
  }

  const uniqueDates = Array.from(dateSet)
    .map((dateStr) => new Date(dateStr))
    .sort((a, b) => a.getTime() - b.getTime());

  const totalDays = uniqueDates.length;
  const canDisplay = totalDays <= 3;

  // Ensure reasonable time bounds
  const startHour = Math.max(0, earliestHour - 1);
  const endHour = Math.min(24, latestHour + 1);
  const timeSlots = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  if (!canDisplay) {
    return { days: [], canDisplay: false, totalDays, startHour, endHour, timeSlots };
  }

  // Create day events structure with positioned events
  const dayEvents: DayEvent[] = uniqueDates.map((date) => {
    const dayEvents = validEvents.filter((event) => {
      const eventStart = new Date(event.startTime as string);
      const eventEnd = new Date(event.endTime as string);
      return (
        isSameDay(date, eventStart) ||
        isSameDay(date, eventEnd) ||
        (date > startOfDay(eventStart) && date < startOfDay(eventEnd))
      );
    });

    const eventsWithPosition: EventWithPosition[] = dayEvents.map((event) => {
      const eventStart = new Date(event.startTime as string);
      const eventEnd = new Date(event.endTime as string);

      // Calculate start position and duration for this specific date
      let dayStart = eventStart;
      let dayEnd = eventEnd;

      // If event spans multiple days, clip to current day
      if (!isSameDay(date, eventStart)) {
        dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
      }
      if (!isSameDay(date, eventEnd)) {
        dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
      }

      const startMinutes = getHours(dayStart) * 60 + getMinutes(dayStart);
      const endMinutes = getHours(dayEnd) * 60 + getMinutes(dayEnd);
      const duration = endMinutes - startMinutes;

      // Calculate position as percentage within the visible time range
      const totalMinutes = (endHour - startHour) * 60;
      const offsetMinutes = startMinutes - startHour * 60;
      const top = Math.max(0, (offsetMinutes / totalMinutes) * 100);
      const height = Math.min(100 - top, (duration / totalMinutes) * 100);

      return {
        ...event,
        startPosition: startMinutes,
        duration,
        top,
        height,
      };
    });

    return {
      date,
      events: eventsWithPosition,
    };
  });

  const paddedDays: DayEvent[] = [];

  if (totalDays === 1) {
    // Add empty day before
    paddedDays.push({
      date: addDays(uniqueDates[0], -1),
      events: [],
    });
    // Add the actual event day
    paddedDays.push(...dayEvents);
    // Add empty day after
    paddedDays.push({
      date: addDays(uniqueDates[0], 1),
      events: [],
    });
  } else if (totalDays === 2) {
    // Add the actual event days
    paddedDays.push(...dayEvents);
    // Add empty day at the end
    paddedDays.push({
      date: addDays(uniqueDates[uniqueDates.length - 1], 1),
      events: [],
    });
  } else {
    // For 3 days, no padding needed
    paddedDays.push(...dayEvents);
  }

  return { days: paddedDays, canDisplay: true, totalDays, startHour, endHour, timeSlots };
}

export function EventsCalendar({
  events,
}: {
  events: HackathonDayOf[];
}) {
  const [activeEvent, setActiveEvent] = useState<HackathonDayOf | null>(null);

  const weekData = parseEventsToWeekCalendar(events);

  if (!weekData.canDisplay) {
    return (
      <div className="flex flex-col items-center gap-4 p-10">
        <h3 className="font-semibold">Can't display week view</h3>
        <p className="text-sm">
          Events span across {weekData.totalDays} days, which is more than the maximum of 3 days
          supported.
        </p>
      </div>
    );
  }

  if (weekData.days.length === 0) {
    return (
      <Card className="rounded-xl p-6">
        <div className="text-center text-muted-foreground">
          <p>No events with valid dates found.</p>
        </div>
      </Card>
    );
  }

  const timeSlotHeight = 80; // Height per hour in pixels
  const totalHeight = weekData.timeSlots.length * timeSlotHeight;

  return (
    <>
      <div className="flex pt-6">
        {/* Axis */}
        <div className="mr-4 w-16 flex-shrink-0">
          <div className="relative" style={{ height: totalHeight }}>
            {weekData.timeSlots.map((hour) => (
              <div
                key={hour}
                className="-mt-2 absolute pr-2 text-right text-muted-foreground text-xs"
                style={{
                  top: (hour - weekData.startHour) * timeSlotHeight,
                  width: "100%",
                }}
              >
                {hour === 0
                  ? "12 AM"
                  : hour === 12
                    ? "12 PM"
                    : hour < 12
                      ? `${hour} AM`
                      : `${hour - 12} PM`}
              </div>
            ))}
          </div>
        </div>

        {/* Columns (grid) */}
        <div className="grid flex-1 grid-cols-3">
          {weekData.days.map((dayEvent, index) => (
            <div key={`${index}_${dayEvent.date}`} className="flex flex-col">
              {/* Day header */}
              <div className="pb-1 text-center">
                <div className="font-semibold text-sm">{format(dayEvent.date, "EEE")}</div>
                <div className="text-muted-foreground text-xs">
                  {format(dayEvent.date, "MMM d")}
                </div>
              </div>

              {/* Column */}
              <div className="relative border-border/50 border-l" style={{ height: totalHeight }}>
                {/* Hour lines */}
                {weekData.timeSlots.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-border/50 border-t"
                    style={{ top: (hour - weekData.startHour) * timeSlotHeight }}
                  />
                ))}

                {/* Events */}
                {dayEvent.events.map((event) => (
                  <div
                    key={event._id}
                    className="absolute right-1 left-1"
                    style={{
                      top: `${event.top}%`,
                      height: `${event.height}%`,
                      minHeight: "20px",
                    }}
                  >
                    <Card
                      className="h-full cursor-pointer overflow-hidden p-2 transition-shadow hover:shadow-md"
                      onClick={() => setActiveEvent(event)}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <div className="line-clamp-2 min-h-4 font-medium text-xs">
                          {event.name || "Untitled Event"}
                        </div>

                        <div className="space-y-1 text-muted-foreground text-xs">
                          {event.startTime && (
                            <div>
                              {format(new Date(event.startTime), "h:mm a")}
                              {event.endTime && ` - ${format(new Date(event.endTime), "h:mm a")}`}
                            </div>
                          )}

                          {event.location && <div className="truncate">📍 {event.location}</div>}

                          {event.type && (
                            <div>
                              <span
                                className={`rounded px-1 py-0.5 font-medium text-xs ${
                                  event.type === "main"
                                    ? "bg-blue-100 text-blue-800"
                                    : event.type === "workshops"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {event.type}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <EventDialog
        open={!!activeEvent}
        onClose={() => setActiveEvent(null)}
        activeEvent={activeEvent}
      />
    </>
  );
}
