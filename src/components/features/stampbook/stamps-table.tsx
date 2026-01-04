import { Card, CardContent } from "@/components/ui/card";
import { DataTable, createTableColumnHelper } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import type { Stamp } from "@/lib/firebase/types";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { Check, Eye, EyeOff, QrCode, X } from "lucide-react";
import { useState } from "react";
import { StampDialog } from "./stamp-dialog";

export function StampsTable({
  stamps,
}: {
  stamps: Stamp[];
}) {
  const [search, setSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [activeStamp, setActiveStamp] = useState<Stamp | null>(null);

  const columnHelper = createTableColumnHelper<Stamp>();
  const columns = [
    columnHelper.accessor("_id", {
      header: "id",
    }),
    columnHelper.accessor("imgURL", {
      header: "Image",
      size: 96,
      cell: (info) => {
        const imageUrl = info.getValue();
        return imageUrl ? (
          <img
            src={imageUrl}
            alt="Stamp"
            className="aspect-square w-16 rounded-md bg-theme-light object-contain p-2 shadow-md"
          />
        ) : (
          <div className="flex aspect-square w-16 items-center justify-center rounded-md bg-gray-100 text-gray-400">
            No image
          </div>
        );
      },
    }),
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: (info) => {
        const desc = info.getValue();
        return desc ? (
          <span className="line-clamp-2 w-[200px]">{desc}</span>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    }),
    columnHelper.accessor("hackathon", {
      header: "Hackathon",
      cell: (info) => info.getValue() || <span className="text-gray-400">Global</span>,
    }),
    columnHelper.accessor("isHidden", {
      header: "Visibility",
      cell: (info) => {
        const isHidden = info.getValue();
        return isHidden ? (
          <div className="flex items-center gap-1 text-gray-500">
            <EyeOff className="h-4 w-4" />
            <span>Hidden</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-green-600">
            <Eye className="h-4 w-4" />
            <span>Visible</span>
          </div>
        );
      },
    }),
    columnHelper.accessor("isQRUnlockable", {
      header: "QR",
      cell: (info) => {
        const hasQR = info.getValue();
        return hasQR ? (
          <QrCode className="h-4 w-4 text-gray-400" />
        ) : (
          <X className="h-4 w-4 text-gray-400" />
        );
      },
    }),
    columnHelper.accessor("criteria", {
      header: "Criteria",
      cell: (info) => {
        const criteria = info.getValue();
        return criteria && criteria.length > 0 ? (
          <Check className="h-4 w-4" />
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    }),
    columnHelper.accessor("lastModifiedBy", {
      header: "Modified by",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("lastModified", {
      header: "Modified",
      cell: (info) => {
        const timestamp = info.getValue();
        return timestamp?.toDate().toLocaleString();
      },
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
              placeholder="Search stamps..."
            />
          </div>
          <DataTable
            columns={columns}
            data={stamps}
            globalFilter={search}
            columnFilters={columnFilters}
            setColumnFilters={setColumnFilters}
            setGlobalFilter={setSearch}
            onRowClick={(data) =>
              setActiveStamp(stamps?.find((s) => s._id === data._id) ?? null)
            }
            emptyMessage="No stamps found"
          />
        </CardContent>
      </Card>

      <StampDialog
        open={!!activeStamp}
        onClose={() => setActiveStamp(null)}
        activeStamp={activeStamp}
      />
    </>
  );
}

