import { createTableColumnHelper, DataTable } from "@/components/ui/data-table";
import type { ContestQuestion } from "@/lib/firebase/types";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { CardContent, Card } from "@/components/ui/card";

//example data, waiting until factotum rework
const questions: ContestQuestion[] = [
  //blank data for now
];
export default function CheckedInTable() {
  const [search, setSearch] = useState<string>("");

  const columnHelper = createTableColumnHelper<ContestQuestion>();

  const columns = [
    columnHelper.accessor("username", {
      header: "Username",
    }),
    columnHelper.accessor("email", {
      header: "Email",
    }),
    columnHelper.accessor("type", {
      header: "Type",
    }),
    columnHelper.accessor("firstname", {
      header: "First Name",
    }),
    columnHelper.accessor("lastname", {
      header: "Last Name",
    }),

    columnHelper.accessor("preferredname", {
      header: "Preferred Name",
    }),
    columnHelper.accessor("phonenumber", {
      header: "Phone Number",
    }),
  ];
  return (
    <div>
      <h1 className="line-height-10 mb-5 font-bold text-2xl">Checked-In Table</h1>

      <Card className="w-full rounded-xl">
        <CardContent>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="mb-5"
          />
          <DataTable
            columns={columns}
            data={questions}
            defaultPageSize={10}
            pageSizeOptions={[5, 10, 20, 50]}
            globalFilter={search}
            setGlobalFilter={setSearch}
          />
        </CardContent>
      </Card>
    </div>
  );
}
