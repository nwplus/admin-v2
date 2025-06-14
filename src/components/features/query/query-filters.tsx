import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Menu, Filter, ArrowUpDown, Group } from "lucide-react";
import { GroupBy } from "./popovers/group-by";

interface QueryFiltersProps {
  filters: {
    filter: string;
    sort: string;
  };
  onFiltersChange: (filters: { filter: string; sort: string }) => void;
  selectedColumns: string[];
  availableColumns: string[];
  onColumnToggle: (column: string) => void;
  tableData: any[];
  onGroupByChange: (opts: { groupByColumn: string; aggregationFunction: string; aggregationColumn: string }) => void;
}

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "accepted", label: "Accepted" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "inProgress", label: "In Progress" },
] as const;

const SORT_OPTIONS = [
  { value: "none", label: "None" },
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
] as const;

export function QueryFilters({
  filters,
  onFiltersChange,
  selectedColumns,
  availableColumns,
  onColumnToggle,
  tableData,
  onGroupByChange,
}: QueryFiltersProps) {
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleColumnsChange = (columns: string[]) => {
    const columnsToAdd = columns.filter(col => !selectedColumns.includes(col));
    const columnsToRemove = selectedColumns.filter(col => !columns.includes(col));
    [...columnsToAdd, ...columnsToRemove].forEach(column => {
      onColumnToggle(column);
    });
  };

  const columnOptions = availableColumns.map(column => ({
    label: column,
    value: column,
  }));

  const columns = tableData[0] ? Object.keys(tableData[0]) : [];
  const columnTypes = Object.fromEntries(
    columns.map(col => [col, typeof tableData[0]?.[col]])
  );

  /**
   * Definitions to determine which columns are groupable and aggreagtable.
   * For example, SUM/AVG can only be applied to numeric columns.
   */
  const countColumns = columns;
  const sumAvgColumns = columns.filter(col => columnTypes[col] === "number");
  const minMaxColumns = columns.filter(col =>
    columnTypes[col] === "number" ||
    columnTypes[col] === "string" ||
    tableData[0]?.[col] instanceof Date
  );
  const aggregatableColumnsMap = {
    COUNT: countColumns,
    SUM: sumAvgColumns,
    AVERAGE: sumAvgColumns,
    MIN: minMaxColumns,
    MAX: minMaxColumns,
  };
  const groupableColumns = columns.filter(col => {
    const val = tableData[0]?.[col];
    return typeof val === "string" || typeof val === "boolean";
  });

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Menu className="w-4 h-4" />
            <span className="text-sm font-medium">Outline</span>
          </div>
          <MultiSelect
            compressed
            selectAll
            options={columnOptions}
            selected={selectedColumns}
            onChange={handleColumnsChange}
            placeholder="Select columns..."
            className="w-full max-h-9"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Group className="w-4 h-4" />
            <span className="text-sm font-medium">Group By</span>
          </div>
          <GroupBy
            groupableColumns={groupableColumns}
            aggregatableColumnsMap={aggregatableColumnsMap}
            onApply={onGroupByChange}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter</span>
          </div>
          <Select 
            value={filters.filter} 
            onValueChange={(value) => handleFilterChange("filter", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select filter..." />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" />
            <span className="text-sm font-medium">Sort</span>
          </div>
          <Select 
            value={filters.sort} 
            onValueChange={(value) => handleFilterChange("sort", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select sorting..." />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
} 