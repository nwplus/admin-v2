import { DataTable, createTableColumnHelper } from "@/components/ui/data-table";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { useState, useMemo, useEffect } from "react";
import type { GroupBySelection, FilterRowsSelection } from "./query-interface";

interface QueryData {
  [key: string]: any;
}

interface QueryTableProps {
  data: QueryData[];
  selectedColumns: string[];
  groupBySelection?: GroupBySelection;
  filterSelection?: FilterRowsSelection;
  sorting: SortingState;
  onSortingChange: (updater: SortingState | ((prev: SortingState) => SortingState)) => void;
}

/**
 * Displays table data. Selections, grouping, filtering, and sorting are all applied to the data here.
 * Interfaces off the data table component.
 */
export function QueryTable({ data, selectedColumns, groupBySelection, filterSelection, sorting, onSortingChange }: QueryTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return "undefined";
    if (typeof value === "boolean") return value.toString();
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    return String(value);
  };

  /**
   * Filter data based on the filterSelection.
   */
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply filterSelection logic
    if (filterSelection && filterSelection.filterColumn && filterSelection.filterCondition && filterSelection.filterValue !== undefined) {
      const { filterColumn, filterCondition, filterValue } = filterSelection;
      filtered = filtered.filter(row => {
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
            return value > filterValue;
          case "less_than":
            return value < filterValue;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [data, filterSelection]);

  /**
   * Returns default column headers and values based on selected filters.
   * Note that grouping, filtering, and sorting all take priority over selecting columns.
   */
  const columns = useMemo(() => {
    // Shorter alias for the table column helper
    const columnHelper = createTableColumnHelper<QueryData>();

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

  /**
   * Returns grouped data based on the groupBySelection.
   */
  const groupedData = useMemo(() => {
    if (!groupBySelection) return filteredData;
    const groups: Record<string, any[]> = {};
    filteredData.forEach(row => {
      const key = String(row[groupBySelection.groupByColumn]);
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });
    return Object.entries(groups).map(([key, rows]) => {
      let aggValue;
      const values = rows.map(r => r[groupBySelection.aggregationColumn]).filter(v => v !== undefined && v !== null);
      switch (groupBySelection.aggregationFunction) {
        case "COUNT":
          aggValue = values.length;
          break;
        case "SUM":
          aggValue = values.reduce((a, b) => a + b, 0);
          break;
        case "AVERAGE":
          aggValue = values.length ? (values.reduce((a, b) => a + b, 0) / values.length) : 0;
          break;
        case "MIN":
          aggValue = Math.min(...values);
          break;
        case "MAX":
          aggValue = Math.max(...values);
          break;
        default:
          aggValue = values.length;
      }
      return {
        [groupBySelection.groupByColumn]: key,
        [`${groupBySelection.aggregationFunction} ${groupBySelection.aggregationColumn}`]: aggValue,
      };
    });
  }, [filteredData, groupBySelection]);

  return (
    <div className="space-y-4 w-full overflow-hidden">
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