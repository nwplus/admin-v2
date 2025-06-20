import { createTableColumnHelper, DataTable } from "@/components/ui/data-table"
import type { ContestQuestion } from "@/lib/firebase/types"
import { useState } from "react";
import { Input } from "@/components/ui/input";

//example data, waiting until factotum rework
const questions : ContestQuestion[] = [
    {
        username: "johnsmith",
        email: "john@nwplus.io",
        type: "Hacker",
        firstname: "John",
        lastname: "Smith",
        preferredname: "John",
        phonenumber: "111-111-1111"

    },
    {
        username: "foobar",
        email: "foo@nwplus.io",
        type: "Mentor",
        firstname: "Foo",
        lastname: "Bar",
        preferredname: "Foo",
        phonenumber: "222-222-2222"

    }
]
export default function CheckedInTable() {
    const [search, setSearch] = useState<string>("");   

    const columnHelper = createTableColumnHelper<ContestQuestion>()

    const columns = [
        columnHelper.accessor("username", {
            header: "Username"
        }),
        columnHelper.accessor("email", {
            header: "Email"
        }),
        columnHelper.accessor("type", {
            header: "Type"
        }),
        columnHelper.accessor("firstname", {
            header: "First Name"
        }),
        columnHelper.accessor("lastname", {
            header: "Last Name"
        }),
       
        columnHelper.accessor("preferredname", {
            header: "Preferred Name"
        }),
        columnHelper.accessor("phonenumber", {
            header: "Phone Number"
        }),

    ]
    return (
        <div>
            <h1 className="font-bold text-2xl line-height-10 mb-5">Checked-In Table</h1>

        <div className="p-5 border-2 border-gray-300 rounded-xl">
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
                    
        </div>
          

        </div>
    )
}