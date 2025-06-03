import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/hackathons/$hackathonId/schedule")({
  component: ScheduleComponent,
});

function ScheduleComponent() {
  return <div>Hello "/_auth/hackathons/$hackathonId/schedule"!</div>;
}
