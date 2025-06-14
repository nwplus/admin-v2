import { DataTable, createTableColumnHelper } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useState, useMemo } from "react";

interface QueryData {
  [key: string]: any;
}

interface GroupBySelection {
  groupByColumn: string;
  aggregationFunction: string;
  aggregationColumn: string;
}

interface QueryTableProps {
  data: QueryData[];
  selectedColumns: string[];
  filters: {
    filter: string;
    sort: string;
  };
  groupBySelection?: GroupBySelection;
}

export function QueryTable({ data, selectedColumns, filters, groupBySelection }: QueryTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return "undefined";
    if (typeof value === "boolean") return value.toString();
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    return String(value);
  };

  // Filter data based on the filters prop
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply filter logic based on filters.filter
    if (filters.filter && filters.filter !== "all" && filters.filter !== "") {
      filtered = filtered.filter(row => {
        // Example filter logic - you can customize this based on your needs
        if (filters.filter === "accepted") {
          return row.applicationStatus?.toLowerCase().includes("accepted");
        }
        if (filters.filter === "pending") {
          return row.applicationStatus?.toLowerCase().includes("progress");
        }
        if (filters.filter === "rejected") {
          return row.applicationStatus?.toLowerCase().includes("rejected");
        }
        return true;
      });
    }

    return filtered;
  }, [data, filters]);

  // Shorter alias for the table column helper
  const columnHelper = createTableColumnHelper<QueryData>();

  /**
   * Returns columns based on selected filters.
   */
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
            emptyMessage="No data available"
            defaultPageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </div>
    </div>
  );
}