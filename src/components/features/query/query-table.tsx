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
    filterSelection,
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
   * Applies filter operators to selected columns.
   */
  const filteredData = useMemo(() => {
    let filtered = [...tableData];

    // filterSelection logic
    if (
      filterSelection?.filterColumn &&
      filterSelection.filterCondition &&
      filterSelection.filterValue !== undefined
    ) {
      const { filterColumn, filterCondition, filterValue } = filterSelection;
      filtered = filtered.filter((row) => {
        const value = row[filterColumn];
        switch (filterCondition) {
          case "matches":
            return String(value).includes(filterValue);
          case "does_not_match":
            return !String(value).includes(filterValue);
          case "equals":
            return String(value) === filterValue;
          case "not_equals":
            return String(value) !== filterValue;
          case "greater_than":
            return value && value > filterValue;
          case "less_than":
            return value && value < filterValue;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [tableData, filterSelection]);

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
          cell: (info) => info.getValue(),
        }),
        columnHelper.accessor(
          `${groupBySelection.aggregationFunction} ${groupBySelection.aggregationColumn}`,
          {
            header: `${groupBySelection.aggregationFunction} ${groupBySelection.aggregationColumn}`,
            cell: (info) => info.getValue(),
          },
        ),
      ];
    }
    return selectedColumns.map((columnName) =>
      columnHelper.accessor(columnName, {
        header: columnName,
        cell: (info) => formatCellValue(info.getValue()),
        enableSorting: true,
        enableColumnFilter: true,
        size: 150,
        minSize: 120,
        maxSize: 300,
      }),
    );
  }, [selectedColumns, groupBySelection]);

  /**
   * Returns grouped data based on the groupBySelection.
   */
  const groupedData = useMemo(() => {
    if (!groupBySelection) return filteredData;
    const groups: Record<string, FlattenedApplicant[]> = {};
    for (const row of filteredData) {
      const key = String(row[groupBySelection.groupByColumn]);
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }
    return Object.entries(groups).map(([key, rows]) => {
      let aggValue: string | number | boolean | Date | null | Record<string, boolean> | undefined;
      const values = rows
        .map((r) => r[groupBySelection.aggregationColumn])
        .filter((v) => v !== undefined && v !== null);
      switch (groupBySelection.aggregationFunction) {
        case "COUNT":
          aggValue = values.length;
          break;
        case "SUM":
          aggValue = (values as number[]).reduce((a, b) => (a as number) + (b as number), 0);
          break;
        case "AVERAGE":
          aggValue = values.length
            ? (values as number[]).reduce((a, b) => (a as number) + (b as number), 0) /
              values.length
            : 0;
          break;
        case "MIN":
          aggValue = Math.min(...(values as number[]));
          break;
        case "MAX":
          aggValue = Math.max(...(values as number[]));
          break;
        default:
          aggValue = values.length;
      }
      return {
        [groupBySelection.groupByColumn]: key,
        [`${groupBySelection.aggregationFunction} ${groupBySelection.aggregationColumn}`]: aggValue,
      } as FlattenedApplicant;
    });
  }, [filteredData, groupBySelection]);

  return (
    <div className="w-full space-y-4 overflow-hidden">
      <div className="w-full overflow-x-auto">
        <div className="max-w-full">
          <DataTable
            columns={columns}
            data={groupedData}
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
