import { PageHeader } from "@/components/graphy/typo";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/hackathons/$hackathonId/application")({
  component: ApplicationComponent,
});

function ApplicationComponent() {
  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <PageHeader className="flex items-center gap-3">Portal Application</PageHeader>
      </div>
    </div>
  );
}
