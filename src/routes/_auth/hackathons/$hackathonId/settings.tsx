import { HackathonSettingsForm } from "@/components/features/settings/hackathon-settings-form";
import { PageHeader } from "@/components/graphy/typo";
import { Badge } from "@/components/ui/badge";
import { useHackathon } from "@/providers/hackathon-provider";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/hackathons/$hackathonId/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const { hackathonId } = Route.useParams();
  const { activeHackathon } = useHackathon();

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <PageHeader className="flex items-center gap-3">
          Settings
          <Badge variant="secondary">{activeHackathon}</Badge>
        </PageHeader>
      </div>
      <HackathonSettingsForm hackathonId={hackathonId} />
    </div>
  );
}
