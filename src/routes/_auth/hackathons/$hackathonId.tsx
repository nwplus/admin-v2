import { createFileRoute } from "@tanstack/react-router";

/**
 * Corresponds to Firestore Hackathons/[doc id]
 */
export const Route = createFileRoute("/_auth/hackathons/$hackathonId")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_auth/hackathons/$hackathonId"!</div>;
}
