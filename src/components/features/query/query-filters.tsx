import { MultiSelect } from "@/components/ui/multi-select";
import { Menu, Filter, ArrowUpDown, Group } from "lucide-react";
import { GroupBy } from "./popovers/group-by";
import { FilterRows } from "./popovers/filter-rows";
import { SortBy } from "./popovers/sort-by";
import { useQuery } from "@/providers/query-provider";

interface QueryFiltersProps {
  availableColumns: string[];
}

export function QueryFilters({
  availableColumns
}: QueryFiltersProps) {
  const {
    selectedColumns,
    onColumnToggle,
    onGroupByChange,
    filterSelections,
    onFilterAdd,
    onFilterRemove,
    onFilterOperatorChange,
    sorting,
    onSortingChange,
    tableData,
  } = useQuery();

  const handleColumnsChange = (columns: string[]) => {
    const columnsToAdd = columns.filter(col => !selectedColumns.includes(col));
    const columnsToRemove = selectedColumns.filter(col => !columns.includes(col));
    for (const column of [...columnsToAdd, ...columnsToRemove]) {
      onColumnToggle(column);
    }
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
    <div className="space-y-4 overflow-hidden rounded-lg bg-gray-50 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Menu className="h-4 w-4" />
            <span className="font-medium text-sm">Outline</span>
          </div>
          <MultiSelect
            compressed
            selectAll
            options={columnOptions}
            selected={selectedColumns}
            onChange={handleColumnsChange}
            placeholder="Select columns..."
            className="max-h-9 w-full"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Group className="h-4 w-4" />
            <span className="font-medium text-sm">Group By</span>
          </div>
          <GroupBy
            groupableColumns={groupableColumns}
            aggregatableColumnsMap={aggregatableColumnsMap}
            onApply={onGroupByChange}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium text-sm">Filter</span>
          </div>
          <FilterRows
            columns={columns}
            columnTypes={columnTypes}
            filterSelections={filterSelections}
            onAddFilter={onFilterAdd}
            onRemoveFilter={onFilterRemove}
            onFilterOperatorChange={onFilterOperatorChange}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            <span className="font-medium text-sm">Sort</span>
          </div>
          <SortBy
            columns={selectedColumns}
            sorting={sorting}
            setSorting={onSortingChange}
          />
        </div>
      </div>
    </div>
  );
} 