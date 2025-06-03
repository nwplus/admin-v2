import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/hackathons/$hackathonId/sponsors")({
  component: SponsorsComponent,
});

function SponsorsComponent() {
  return <div>Hello "/_auth/hackathons/$hackathonId/sponsors"!</div>;
}
