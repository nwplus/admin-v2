import { Card, CardContent } from "@/components/ui/card";
import { DataTable, createTableColumnHelper } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FAQ, Hackathon } from "@/lib/firebase/types";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { FAQDialog } from "./faq-dialog";

export function QuestionsTable({
  questions,
  hackathons,
}: {
  questions: FAQ[];
  hackathons: Hackathon[];
}) {
  const [search, setSearch] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [activeFaq, setActiveFaq] = useState<FAQ | null>(null);

  const sites = useMemo(() => {
    const allHackathonIds = questions.flatMap((question) => question.hackathonIDs || []);
    return [...new Set(allHackathonIds)].sort();
  }, [questions]);

  const handleFilter = (value: string) => {
    if (value !== "all") {
      setColumnFilters([{ id: "hackathonIDs", value }]);
    } else {
      setColumnFilters([]);
    }
  };

  const columnHelper = createTableColumnHelper<FAQ>();
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
    columnHelper.accessor("category", {
      header: "Category",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("question", {
      header: "Question",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("hackathonIDs", {
      header: "Hackathons",
      filterFn: (row, columnId, filterValue) => {
        const hackathonIds = row.getValue(columnId) as string[];
        if (!hackathonIds || !Array.isArray(hackathonIds)) return false;
        return hackathonIds.includes(filterValue);
      },
      cell: (info) => {
        const hackathonIds = info.getValue();
        if (!hackathonIds || !Array.isArray(hackathonIds) || hackathonIds.length === 0) {
          return "None";
        }
        return (
          <div className="flex flex-wrap">
            {hackathonIds.map((hackathon, index) => (
              <div
                key={`${index}_${hackathon}`}
                className="mr-1 mb-1 inline-block rounded bg-gray-100 px-2 py-1 text-xs"
              >
                {hackathon}
              </div>
            ))}
          </div>
        );
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
            <Select onValueChange={handleFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by website" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Websites</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site} value={site}>
                    {site}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DataTable
            columns={columns}
            data={questions}
            globalFilter={search}
            columnFilters={columnFilters}
            setColumnFilters={setColumnFilters}
            setGlobalFilter={setSearch}
            onRowClick={(data) => setActiveFaq(questions?.find((q) => q._id === data._id) ?? null)}
            emptyMessage="No questions found"
          />
        </CardContent>
      </Card>

      <FAQDialog
        open={!!activeFaq}
        onClose={() => setActiveFaq(null)}
        activeFaq={activeFaq}
        hackathons={hackathons}
      />
    </>
  );
}
