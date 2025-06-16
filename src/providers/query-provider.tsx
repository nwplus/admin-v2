import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from "react";
import type { SortingState } from "@tanstack/react-table";
import type { FlattenedApplicant } from "@/services/query";
import { useApplicant } from "./applicant-provider";

/**
 * Users can group by a column and apply an aggregation function to another column.
 * This interface represents these three selections. 
 */
export interface GroupBySelection {
  groupByColumn: string;
  aggregationFunction: string;
  aggregationColumn: string;
}

/**
 * Users can filter the data based on a column and a condition.
 * This interface represents this selection.
 * TODO: add support for multiple filters.
 */
export interface FilterRowsSelection {
  filterColumn: string;
  filterCondition: string;
  filterValue: string;
}

interface QueryContextType {
  selectedColumns: string[];
  groupBySelection: GroupBySelection | undefined;
  filterSelection: FilterRowsSelection | undefined;
  sorting: SortingState;
  tableData: FlattenedApplicant[];
  onColumnToggle: (column: string) => void;
  onGroupByChange: (selection: GroupBySelection | undefined) => void;
  onFilterChange: (selection: FilterRowsSelection | undefined) => void;
  onSortingChange: (updater: SortingState | ((prev: SortingState) => SortingState)) => void;
}

const QueryContext = createContext<QueryContextType | undefined>(undefined);

const DEFAULT_SELECTED_COLUMNS = [
  "firstName",
  "lastName",
  "email",
  "applicationStatus",
  "school",
  "major",
  "numHackathonsAttended",
  "MLHCodeOfConduct"
];

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Maintains the state of query filters (grouping, filtering, sorting) 
 * selected by the user and the resulting display data.
 * 
 * Primarily used in the query page.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const { applicants } = useApplicant();
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_SELECTED_COLUMNS);
  const [groupBySelection, setGroupBySelection] = useState<GroupBySelection | undefined>(undefined);
  const [filterSelection, setFilterSelection] = useState<FilterRowsSelection | undefined>(undefined);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [tableData, setTableData] = useState<FlattenedApplicant[]>([]);

  useEffect(() => {
    setTableData(applicants);
  }, [applicants]);

  const handleColumnToggle = useCallback((column: string) => {
    setSelectedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  }, []);

  const value = {
    selectedColumns,
    groupBySelection,
    filterSelection,
    sorting,
    tableData,
    onColumnToggle: handleColumnToggle,
    onGroupByChange: setGroupBySelection,
    onFilterChange: setFilterSelection,
    onSortingChange: setSorting,
  };

  return (
    <QueryContext.Provider value={value}>
      {children}
    </QueryContext.Provider>
  );
}

export function useQuery() {
  const context = useContext(QueryContext);
  if (context === undefined) {
    throw new Error("useQuery must be used within a QueryProvider");
  }
  return context;
} 