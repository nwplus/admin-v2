import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { HackathonDayOf } from "@/lib/firebase/types";
import { Calendar, Table } from "lucide-react";
import { EventsCalendar } from "./events-calendar";
import { EventsTable } from "./events-table";

interface ScheduleCardProps {
  events: HackathonDayOf[];
}

export function ScheduleCard({ events }: ScheduleCardProps) {
  return (
    <Card className="w-full rounded-xl">
      <Tabs defaultValue="events">
        <CardHeader>
          <TabsList>
            <TabsTrigger value="events">
              <Table />
              Events
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar />
              Calendar
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <TabsContent value="events">
            <EventsTable events={events} />
          </TabsContent>
          <TabsContent value="calendar">
            <EventsCalendar events={events} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
