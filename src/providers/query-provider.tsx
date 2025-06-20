import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from "react";
import type { SortingState } from "@tanstack/react-table";
import type { FlattenedApplicant } from "@/services/query";
import { subscribeToHackathons } from "@/lib/firebase/firestore";
import { subscribeToApplicants, flattenApplicantData } from "@/services/query";
import type { Hackathon } from "@/lib/firebase/types";
import { Loading } from "@/components/ui/loading";


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
  // Applicant state (based on selected hackathon)
  hackathons: Hackathon[];
  selectedHackathon: string;
  setSelectedHackathon: (hackathon: string) => void;
  applicants: FlattenedApplicant[];
  isLoading: boolean;

  // Current query state (selected columns, grouping, filtering, sorting)
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
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<string>("");
  const [applicants, setApplicants] = useState<FlattenedApplicant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_SELECTED_COLUMNS);
  const [groupBySelection, setGroupBySelection] = useState<GroupBySelection | undefined>(undefined);
  const [filterSelection, setFilterSelection] = useState<FilterRowsSelection | undefined>(undefined);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [tableData, setTableData] = useState<FlattenedApplicant[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToHackathons((hackathons) => {
      setHackathons(hackathons);
      if (hackathons.length > 0 && !selectedHackathon) {
        setSelectedHackathon(hackathons[hackathons.length - 2]._id);
      }
    });
    return () => unsubscribe();
  }, [selectedHackathon]);

  useEffect(() => {
    if (!selectedHackathon) return;

    const unsubscribe = subscribeToApplicants(selectedHackathon, (applicants) => {
      const flattenedApplicants = applicants.map(flattenApplicantData);
      setApplicants(flattenedApplicants);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [selectedHackathon]);

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
    hackathons,
    selectedHackathon,
    setSelectedHackathon,
    applicants,
    isLoading,
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

      {isLoading ? <Loading variant="small"/> : children}

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