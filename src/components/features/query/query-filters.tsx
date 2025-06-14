import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";
import { Menu, Filter, ArrowUpDown } from "lucide-react";

interface QueryFiltersProps {
  filters: {
    groupBy: string;
    filter: string;
    sort: string;
  };
  onFiltersChange: (filters: { groupBy: string; filter: string; sort: string }) => void;
  selectedColumns: string[];
  availableColumns: string[];
  onColumnToggle: (column: string) => void;
}

const GROUP_BY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "category", label: "Category" },
  { value: "status", label: "Status" },
  { value: "year", label: "Academic Year" },
  { value: "application", label: "Application Status" },
] as const;

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
          <span className="text-sm font-medium">Group By</span>
          <Select 
            value={filters.groupBy} 
            onValueChange={(value) => handleFilterChange("groupBy", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select grouping..." />
            </SelectTrigger>
            <SelectContent>
              {GROUP_BY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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