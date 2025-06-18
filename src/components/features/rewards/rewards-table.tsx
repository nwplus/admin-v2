import { Card, CardContent } from "@/components/ui/card";
import { DataTable, createTableColumnHelper } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import type { HackathonRewards } from "@/lib/firebase/types";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useState } from "react";
import { RewardDialog } from "./reward-dialog";

export function RewardsTable({
  rewards,
}: {
  rewards: HackathonRewards[];
}) {
  const [search, setSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [activeReward, setActiveReward] = useState<HackathonRewards | null>(null);

  const columnHelper = createTableColumnHelper<HackathonRewards>();
  const columns = [
    columnHelper.accessor("_id", {
      // _id column is hidden by default
      header: "id",
    }),
    columnHelper.accessor("lastmod", {
      header: "Modified",
      cell: (info) => {
        const timestamp = info.getValue();
        return timestamp?.toDate().toLocaleString();
      },
    }),
    columnHelper.accessor("lastmodBy", {
      header: "Modified by",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("reward", {
      header: "Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("type", {
      header: "Type",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("blurb", {
      header: "Blurb",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("imgName", {
      header: "Image",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("imgURL", {
      header: "Image URL",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("prizesAvailable", {
      header: "Available prizes",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("requiredPoints", {
      header: "Required points",
      cell: (info) => info.getValue(),
    }),
  ];

  return (
    <>
      <Card className="w-full rounded-xl">
        <CardContent>
          <div className="flex gap-3 pb-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
            />
          </div>
          <DataTable
            columns={columns}
            data={rewards}
            globalFilter={search}
            columnFilters={columnFilters}
            setColumnFilters={setColumnFilters}
            setGlobalFilter={setSearch}
            onRowClick={(data) => setActiveReward(rewards?.find((q) => q.key === data.key) ?? null)}
            emptyMessage="No rewards found"
          />
        </CardContent>
      </Card>

      <RewardDialog
        open={!!activeReward}
        onClose={() => setActiveReward(null)}
        activeReward={activeReward}
      />
    </>
  );
}
