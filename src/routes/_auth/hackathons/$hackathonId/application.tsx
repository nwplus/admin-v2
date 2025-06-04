import { HackerAppMain } from "@/components/features/hackerapp/hacker-app-main";
import { HackerAppNav } from "@/components/features/hackerapp/hacker-app-nav";
import { splitHackathon } from "@/lib/utils";
import { useHackathon } from "@/providers/hackathon-provider";
import HackerApplicationProvider from "@/providers/hacker-application-provider";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute("/_auth/hackathons/$hackathonId/application")({
  component: ApplicationComponent,
});

function ApplicationComponent() {
  const { activeHackathon } = useHackathon();

  const hackathonData = useMemo(() => splitHackathon(activeHackathon), [activeHackathon]);

  if (!hackathonData[0]) {
    return <>No hackathon</>;
  }

  return (
    <HackerApplicationProvider activeHackathonName={hackathonData[0]}>
      <div className="relative mx-auto flex h-full max-w-7xl gap-6">
        <HackerAppNav hackathonData={hackathonData} />
        <HackerAppMain />
      </div>
    </HackerApplicationProvider>
  );
}
