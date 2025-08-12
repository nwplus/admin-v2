import { Card, CardContent } from "@/components/ui/card";
import { DataTable, createTableColumnHelper } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import type { HackathonDayOf } from "@/lib/firebase/types";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useState } from "react";
import { EventDialog } from "./event-dialog";

export function EventsTable({
  events,
}: {
  events: HackathonDayOf[];
}) {
  const [search, setSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [activeEvent, setActiveEvent] = useState<HackathonDayOf | null>(null);

  const columnHelper = createTableColumnHelper<HackathonDayOf>();
  const columns = [
    columnHelper.accessor("_id", {
      // _id column is hidden by default
      header: "id",
    }),
    columnHelper.accessor("lastModified", {
      header: "Modified",
      cell: (info) => {
        const timestamp = info.getValue();
        return timestamp?.toDate().toLocaleString();
      },
    }),
    columnHelper.accessor("lastModifiedBy", {
      header: "Modified by",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("startTime", {
      header: "Start",
      cell: (info) => {
        const time = info.getValue();
        if (!time) return "";
        try {
          return new Date(time).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          });
        } catch {
          return time;
        }
      },
    }),
    columnHelper.accessor("endTime", {
      header: "End",
      cell: (info) => {
        const time = info.getValue();
        if (!time) return "";
        try {
          return new Date(time).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          });
        } catch {
          return time;
        }
      },
    }),
  ];

  return (
    <>
      <div>
        <div className="flex gap-3 pb-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
          />
        </div>
        <DataTable
          columns={columns}
          data={events}
          globalFilter={search}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          setGlobalFilter={setSearch}
          onRowClick={(data) => setActiveEvent(events?.find((q) => q._id === data._id) ?? null)}
          emptyMessage="No questions found"
        />
      </div>

      <EventDialog
        open={!!activeEvent}
        onClose={() => setActiveEvent(null)}
        activeEvent={activeEvent}
      />
    </>
  );
}
