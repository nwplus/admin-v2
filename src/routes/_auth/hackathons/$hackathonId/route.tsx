import HackathonProvider from "@/providers/hackathon-provider";
import { Outlet, createFileRoute, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/hackathons/$hackathonId")({
  component: HackathonRouteComponent,
});

function HackathonRouteComponent() {
  const { hackathonId } = useParams({ from: "/_auth/hackathons/$hackathonId" });

  return (
    <HackathonProvider activeHackathon={hackathonId}>
      <Outlet />
    </HackathonProvider>
  );
}
