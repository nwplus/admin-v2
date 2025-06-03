import { PageHeader } from "@/components/graphy/typo";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/query")({
  component: QueryComponent,
});

function QueryComponent() {
  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <PageHeader className="flex items-center gap-3">Query</PageHeader>
      </div>
      <div />
    </div>
  );
}
