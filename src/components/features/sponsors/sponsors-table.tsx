import { Card, CardContent } from "@/components/ui/card";
import { DataTable, createTableColumnHelper } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import type { HackathonSponsors } from "@/lib/firebase/types";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { SponsorDialog } from "./sponsor-dialog";

export function SponsorsTable({
  sponsors,
}: {
  sponsors: HackathonSponsors[];
}) {
  const [search, setSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [activeSponsor, setActiveSponsor] = useState<HackathonSponsors | null>(null);

  const columnHelper = createTableColumnHelper<HackathonSponsors>();
  const columns = [
    columnHelper.accessor("_id", {
      // _id column is hidden by default
      header: "id",
    }),
    columnHelper.accessor("imgURL", {
      header: "Image",
      size: 96,
      cell: (info) => {
        const imageUrl = info.getValue();
        return (
          <img
            src={imageUrl}
            className="aspect-square w-16 rounded-md bg-theme-light object-contain p-4 shadow-md"
          />
        );
      },
    }),
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("tier", {
      header: "Tier",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("blurb", {
      header: "Has blurb?",
      cell: (info) => {
        return info.getValue() ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />;
      },
    }),
    columnHelper.accessor("lastmodBy", {
      header: "Modified by",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("lastmod", {
      header: "Modified",
      cell: (info) => {
        const timestamp = info.getValue();
        return timestamp?.toDate().toLocaleString();
      },
    }),
  ];

  return (
    <>
      <Card className="w-full">
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
            data={sponsors}
            globalFilter={search}
            columnFilters={columnFilters}
            setColumnFilters={setColumnFilters}
            setGlobalFilter={setSearch}
            onRowClick={(data) =>
              setActiveSponsor(sponsors?.find((s) => s._id === data._id) ?? null)
            }
            emptyMessage="No sponsors found"
          />
        </CardContent>
      </Card>

      <SponsorDialog
        open={!!activeSponsor}
        onClose={() => setActiveSponsor(null)}
        activeSponsor={activeSponsor}
      />
    </>
  );
}
