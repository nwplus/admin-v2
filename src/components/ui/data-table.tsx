import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { rankItem } from "@tanstack/match-sorter-utils";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type SortingState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface DataTableProps<T> {
  // biome-ignore lint/suspicious/noExplicitAny: We don't know
  columns: ColumnDef<T, any>[];
  data: T[];
  globalFilter?: string;
  setGlobalFilter?: (arg0: string) => void;
  columnFilters?: ColumnFiltersState;
  setColumnFilters?: OnChangeFn<ColumnFiltersState>;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
}

export function DataTable<T>({
  columns,
  data,
  globalFilter,
  setGlobalFilter,
  columnFilters,
  setColumnFilters,
  onRowClick,
  pageSizeOptions = [10, 15, 20, 30, 40, 50],
  emptyMessage = "No data found",
  defaultPageSize = 15,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState([]);

  // biome-ignore lint/suspicious/noExplicitAny: We don't know
  const fuzzyFilter = (row: any, columnId: string, value: any, addMeta: any) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    addMeta({
      itemRank,
    });
    return itemRank.passed;
  };

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      globalFilter,
      sorting,
      columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting as OnChangeFn<SortingState>,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      columnVisibility: {
        _id: false,
      },
      pagination: {
        pageSize: defaultPageSize,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="w-full overflow-auto rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="border-neutral-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "select-none px-1.5 py-2 text-left font-medium text-neutral-800 text-sm",
                      header.column.getIsSorted() ? "bg-neutral-100" : "",
                      header.column.getCanSort() ? "cursor-pointer" : "",
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                    onKeyDown={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <div className="text-ui-60">
                        {{
                          asc: <ChevronUp height={16} width={16} />,
                          desc: <ChevronDown height={16} width={16} />,
                        }[header.column.getIsSorted() as "asc" | "desc"] ?? null}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white text-sm">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onKeyDown={
                    onRowClick ? (e) => e.key === "Enter" && onRowClick(row.original) : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-1.5 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-1.5 py-1.5 pt-4 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex select-none items-center">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ArrowLeft />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ArrowRight />
        </Button>

        <span className="flex-grow pl-3 text-neutral-800 text-sm">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">Rows per page:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="rounded border px-2 py-1 text-sm"
          >
            {pageSizeOptions.map((pageSize: number) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// Helper function to create common column types
export function createTableColumnHelper<T>() {
  return createColumnHelper<T>();
}
