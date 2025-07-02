import { DataTable, createTableColumnHelper } from "@/components/ui/data-table";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useState, useMemo } from "react";
import type { FlattenedApplicant } from "@/services/query";
import { useQuery } from "@/providers/query-provider";

const columnHelper = createTableColumnHelper<FlattenedApplicant>();

/**
 * Displays table data. Selections, grouping, filtering, and sorting are all applied to the data here.
 * Interfaces off the data table component.
 */
export function QueryTable() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const {
    tableData,
    selectedColumns,
    groupBySelection,
    sorting,
    onSortingChange,
  } = useQuery();

  function isNonNullObject(val: unknown): val is Record<string, boolean> {
    return typeof val === "object" && val !== null && !Array.isArray(val);
  }

  /**
   * Format cell values for display. 
   * The applicant schema has changed over time -- some previously typed string values are now objects, which are handled here.
   */
  const formatCellValue = (value: unknown) => {
    if (value === null || value === undefined) return "undefined";
    if (isNonNullObject(value)) {
      return Object.entries(value)
        .filter(([_, v]) => v)
        .map(([k]) => k)
        .join(", ");
    }
    if (typeof value === "boolean") return value.toString();
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    return String(value);
  };

  /**
   * Returns default column headers and values based on selected filters.
   * Note that grouping, filtering, and sorting all take priority over selecting columns.
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: formatCellValue is stable and does not need to be in the dependency array
  const columns = useMemo(() => {
    if (groupBySelection) {
      return [
        columnHelper.accessor(groupBySelection.groupByColumn, {
          header: groupBySelection.groupByColumn,
          cell: info => info.getValue(),
        }),
        columnHelper.accessor(`${groupBySelection.aggregationFunction} ${groupBySelection.aggregationColumn}`, {
          header: `${groupBySelection.aggregationFunction} ${groupBySelection.aggregationColumn}`,
          cell: info => info.getValue(),
        }),
      ];
    }
    return selectedColumns.map((columnName) =>
      columnHelper.accessor(columnName, {
        header: columnName,
        cell: info => formatCellValue(info.getValue()),
        enableSorting: true,
        enableColumnFilter: true,
        size: 150,
        minSize: 120,
        maxSize: 300,
      })
    );
  }, [selectedColumns, groupBySelection]);

  return (
    <div className="w-full space-y-4 overflow-hidden">
      <div className="w-full overflow-x-auto">
        <div className="max-w-full">
          <DataTable
            columns={columns}
            data={tableData}
            columnFilters={columnFilters}
            setColumnFilters={setColumnFilters}
            sorting={sorting}
            onSortingChange={onSortingChange}
            emptyMessage="No data available"
            defaultPageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </div>
    </div>
  );
}