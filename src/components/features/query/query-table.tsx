import { DataTable, createTableColumnHelper } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useState, useMemo } from "react";

interface QueryData {
  [key: string]: any;
}

interface QueryTableProps {
  data: QueryData[];
  selectedColumns: string[];
  filters: {
    groupBy: string;
    filter: string;
    sort: string;
  };
}

export function QueryTable({ data, selectedColumns, filters }: QueryTableProps) {
  const [calculateValues, setCalculateValues] = useState<Record<string, string>>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const handleCalculateChange = (column: string, value: string) => {
    setCalculateValues(prev => ({
      ...prev,
      [column]: value,
    }));
  };

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

  const columnHelper = createTableColumnHelper<QueryData>();

  const columns = useMemo(() => {
    return selectedColumns.map((columnName) => 
      columnHelper.accessor(columnName, {
        header: () => (
          <div className="space-y-2 min-w-[120px] sm:min-w-[150px]">
            <div className="font-medium text-xs sm:text-sm truncate" title={columnName}>
              {columnName}
            </div>
            <Select
              value={calculateValues[columnName] || ""}
              onValueChange={(value) => handleCalculateChange(columnName, value)}
            >
              <SelectTrigger className="h-7 sm:h-8 text-xs min-w-0">
                <SelectValue placeholder="Calculate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="count">Count</SelectItem>
                <SelectItem value="sum">Sum</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="min">Min</SelectItem>
                <SelectItem value="max">Max</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ),
        cell: (info) => {
          const value = info.getValue();
          const formattedValue = formatCellValue(value);
          
          if (typeof value === "boolean") {
            return (
              <div className="flex items-center gap-1 sm:gap-2">
                <Badge 
                  variant={value ? "default" : "secondary"}
                  className={`${value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"} text-xs px-1 sm:px-2 py-0.5`}
                >
                  {formattedValue}
                </Badge>
              </div>
            );
          }
          
          if (columnName === "applicationStatus") {
            const statusColors: Record<string, string> = {
              "acceptedAndAttending": "bg-green-100 text-green-800",
              "inProgress": "bg-blue-100 text-blue-800",
              "rejected": "bg-red-100 text-red-800",
              "pending": "bg-yellow-100 text-yellow-800"
            };
            
            return (
              <Badge 
                variant="secondary"
                className={`${statusColors[formattedValue] || "bg-gray-100 text-gray-600"} text-xs px-1 sm:px-2 py-0.5`}
              >
                <span className="truncate max-w-[100px] sm:max-w-none" title={formattedValue}>
                  {formattedValue}
                </span>
              </Badge>
            );
          }
          
          return (
            <span className="text-xs sm:text-sm truncate block max-w-[100px] sm:max-w-[200px]" title={formattedValue}>
              {formattedValue}
            </span>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        size: 150,
        minSize: 120,
        maxSize: 300,
      })
    );
  }, [selectedColumns, calculateValues]);

  const dataWithCalculations = useMemo(() => {
    const hasCalculations = Object.values(calculateValues).some(val => val && val !== "");
    
    if (!hasCalculations) {
      return filteredData;
    }

    const summaryRow: QueryData = {};
    selectedColumns.forEach(col => {
      const calcType = calculateValues[col];
      if (calcType && calcType !== "" && calcType !== "none") {
        const values = filteredData.map(row => row[col]).filter(val => val !== null && val !== undefined);
        
        switch (calcType) {
          case "count":
            summaryRow[col] = `Count: ${values.length}`;
            break;
          case "sum":
            const numericValues = values.filter(val => typeof val === "number");
            summaryRow[col] = numericValues.length > 0 ? `Sum: ${numericValues.reduce((a, b) => a + b, 0)}` : "Sum: N/A";
            break;
          case "average":
            const avgValues = values.filter(val => typeof val === "number");
            summaryRow[col] = avgValues.length > 0 ? `Avg: ${(avgValues.reduce((a, b) => a + b, 0) / avgValues.length).toFixed(2)}` : "Avg: N/A";
            break;
          case "min":
            const minValues = values.filter(val => typeof val === "number");
            summaryRow[col] = minValues.length > 0 ? `Min: ${Math.min(...minValues)}` : "Min: N/A";
            break;
          case "max":
            const maxValues = values.filter(val => typeof val === "number");
            summaryRow[col] = maxValues.length > 0 ? `Max: ${Math.max(...maxValues)}` : "Max: N/A";
            break;
          default:
            summaryRow[col] = filteredData[0]?.[col] || "";
        }
      } else {
        summaryRow[col] = filteredData[0]?.[col] || "";
      }
    });

    return [...filteredData, summaryRow];
  }, [filteredData, calculateValues, selectedColumns]);

  return (
    <div className="space-y-4 w-full overflow-hidden">
      {Object.values(calculateValues).some(val => val && val !== "" && val !== "none") && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Badge variant="outline" className="bg-blue-100 border-blue-300 text-blue-700 whitespace-nowrap">
            Calculations Active
          </Badge>
          <span className="text-xs sm:text-sm text-blue-600">
            Summary calculations are shown in the last row
          </span>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <div className="max-w-full">
          <DataTable
            columns={columns}
            data={dataWithCalculations}
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