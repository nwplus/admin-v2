import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/hackathons/$hackathonId/application")({
  component: ApplicationComponent,
});

function ApplicationComponent() {
  return <div>Hello "/_auth/hackathons/$hackathonId/application"!</div>;
}
