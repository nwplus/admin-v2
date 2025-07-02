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
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
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
  sorting,
  onSortingChange,
}: DataTableProps<T>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);

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
      sorting: sorting ?? internalSorting,
      columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: onSortingChange ?? setInternalSorting,
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
    <div className="w-full space-y-4">
      <div className="w-full overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="border-neutral-200 bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "sticky top-0 select-none bg-gray-50 px-2 py-2 text-left font-medium text-neutral-800 text-xs sm:px-3 sm:text-sm",
                      header.column.getIsSorted() ? "bg-neutral-100" : "",
                      header.column.getCanSort() ? "cursor-pointer hover:bg-gray-100" : "",
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                    onKeyDown={header.column.getToggleSortingHandler()}
                    style={{ minWidth: "120px" }}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <div className="flex-shrink-0 text-ui-60">
                        {{
                          asc: <ChevronUp height={12} width={12} className="sm:h-4 sm:w-4" />,
                          desc: <ChevronDown height={12} width={12} className="sm:h-4 sm:w-4" />,
                        }[header.column.getIsSorted() as "asc" | "desc"] ?? null}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="max-w-full divide-y divide-neutral-100 overflow-x-scroll bg-white text-xs sm:text-sm">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "transition-colors",
                    onRowClick ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100" : "",
                  )}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onKeyDown={
                    onRowClick ? (e) => e.key === "Enter" && onRowClick(row.original) : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-2 py-2 align-top sm:px-3">
                      <div className="max-w-[120px] sm:max-w-none">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="flex items-center gap-1"
          >
            <span className="hidden sm:inline">Next</span>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-2 text-neutral-800 text-xs sm:flex-row sm:items-center sm:gap-4 sm:text-sm">
          <span className="whitespace-nowrap">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>

          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-gray-500">Rows per page:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="min-w-0 rounded border px-2 py-1 text-xs sm:text-sm"
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
    </div>
  );
}

// Helper function to create common column types
export function createTableColumnHelper<T>() {
  return createColumnHelper<T>();
}
