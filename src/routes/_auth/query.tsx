import { PageHeader } from "@/components/graphy/typo";
import { Card, CardHeader } from "@/components/ui/card";
import { useMemo } from "react";
import { QueryFilters } from "@/components/features/query/query-filters";
import { QueryTable } from "@/components/features/query/query-table";
import { getAvailableColumns } from "@/services/query";
import { QueryProvider } from "@/providers/query-provider";
import { createFileRoute } from "@tanstack/react-router";
import { QueryActions } from "@/components/features/query/query-actions";
import { HackathonSelector } from "@/components/features/query/hackathon-selector";
import { SavedQueries } from "@/components/features/query/saved-queries";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_auth/query")({
  component: QueryPage,
});

function QueryPage() {
  const availableColumns = useMemo(() => getAvailableColumns(), []);

  return (
    <QueryProvider>
      <div className="flex h-full w-full flex-col gap-3">
        <PageHeader>Query</PageHeader>
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="max-w-full overflow-x-scroll">
              <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <HackathonSelector />
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <SavedQueries>
                    <Button variant="outline">
                      Saved Queries
                    </Button>
                  </SavedQueries>
                  <QueryActions />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <QueryFilters availableColumns={availableColumns} />
                <div className="w-full overflow-hidden">
                  <QueryTable />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </QueryProvider>
  );
}
