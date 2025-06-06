import { PageHeader } from "@/components/graphy/typo";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/factotum")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <PageHeader className="flex items-center gap-3">Factotum</PageHeader>
      </div>
      <div />
    </div>
  );
}
