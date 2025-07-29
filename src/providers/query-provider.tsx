
import { Loading } from "@/components/ui/loading";
import { createContext, useContext, useState, useCallback, type ReactNode, useEffect, useMemo } from "react";
import type { SortingState } from "@tanstack/react-table";
import type { FlattenedApplicant } from "@/services/query";
import { subscribeToHackathons } from "@/lib/firebase/firestore";
import { subscribeToApplicants, flattenApplicantData, calculateApplicantPoints } from "@/services/query";
import type { 
  Hackathon, 
  FilterCondition, 
  AggregationFunction, 
  ApplicantFieldValue, 
  GroupBySelection, 
  FilterRowsSelection 
} from "@/lib/firebase/types";

/**
 * Evaluates whether a single applicant field value satisfies a given filter condition.
 */
function evaluateFilterCondition(
  value: ApplicantFieldValue,
  filterCondition: FilterCondition,
  filterValue: string
): boolean {
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
      return value !== null && value !== undefined && Number(value) > Number(filterValue);
    case "less_than":
      return value !== null && value !== undefined && Number(value) < Number(filterValue);
  }
}

/**
 * Returns true if given row satisfies all filter conditions.
 * Results are combined using the logicalOperator specified (defaults to 'AND' if not specified).
 */
function evaluateFilters(row: FlattenedApplicant, filters: FilterRowsSelection[]): boolean {
  if (filters.length === 0) return true;

  let result = true;

  for (let i = 0; i < filters.length; i++) {
    const filter = filters[i];
    const { filterColumn, filterCondition, filterValue, logicalOperator } = filter;
    const value = row[filterColumn];
    
    const currResult = evaluateFilterCondition(value, filterCondition as FilterCondition, filterValue);

    if (i === 0) {
      result = currResult;
    } else {
      const operator = logicalOperator || 'AND';
      if (operator === 'AND') {
        result = result && currResult;
      } else {
        result = result || currResult;
      }
    }
  }

  return result;
}

/**
 * Applies aggregation function to a set of values
 */
function applyAggregation(
  values: ApplicantFieldValue[],
  aggregationFunction: AggregationFunction
): ApplicantFieldValue {
  const filteredValues = values.filter(v => v !== undefined && v !== null);
  
  switch (aggregationFunction) {
    case "COUNT":
      return filteredValues.length;
    case "SUM":
      return (filteredValues as number[]).reduce((a, b) => a + b, 0);
    case "AVERAGE":
      return filteredValues.length ? (filteredValues as number[]).reduce((a, b) => a + b, 0) / filteredValues.length : 0;
    case "MIN":
      if (filteredValues.length === 0) return null;
      if (typeof filteredValues[0] === "number") {
        return Math.min(...(filteredValues as number[]));
      }
        return filteredValues.reduce((min, current) => 
          String(current) < String(min) ? current : min
        );
    case "MAX":
      if (filteredValues.length === 0) return null;
      if (typeof filteredValues[0] === "number") {
        return Math.max(...(filteredValues as number[]));
      }
        return filteredValues.reduce((max, current) => 
          String(current) > String(max) ? current : max
        );
  }
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
  filterSelections: FilterRowsSelection[];
  sorting: SortingState;
  
  // Final data after processing
  tableData: FlattenedApplicant[];
  
  // Actions
  onColumnToggle: (column: string) => void;
  onGroupByChange: (selection: GroupBySelection | undefined) => void;
  onFilterAdd: (selection: FilterRowsSelection) => void;
  onFilterRemove: (filterId: string) => void;
  onFilterOperatorChange: (filterId: string, operator: 'AND' | 'OR') => void;
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
  "firstTimeHacker",
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
  const [filterSelections, setFilterSelections] = useState<FilterRowsSelection[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const tableData = useMemo(() => {
    let filtered = applicants;
    if (filterSelections.length > 0) {
      filtered = applicants.filter(row => evaluateFilters(row, filterSelections));
    }

    if (!groupBySelection) return filtered;
    
    const groups: Record<string, FlattenedApplicant[]> = {};
    for (const row of filtered) {
      const key = String(row[groupBySelection.groupByColumn]);
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }
    
    return Object.entries(groups).map(([key, rows]) => {
      const values = rows.map(r => r[groupBySelection.aggregationColumn]);
      const aggValue = applyAggregation(values, groupBySelection.aggregationFunction as AggregationFunction);
      
      return {
        [groupBySelection.groupByColumn]: key,
        [`${groupBySelection.aggregationFunction} ${groupBySelection.aggregationColumn}`]: aggValue,
      } as FlattenedApplicant;
    });
  }, [applicants, filterSelections, groupBySelection]);

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

    const unsubscribe = subscribeToApplicants(selectedHackathon, async (applicants) => {
      try {
        const flattenedApplicants = applicants.map(applicant => flattenApplicantData(applicant));
        setApplicants(flattenedApplicants);
        setIsLoading(false);
        
        const pointsMap = await calculateApplicantPoints(applicants, selectedHackathon);
        
        setApplicants(prevApplicants => 
          prevApplicants.map(applicant => ({
            ...applicant,
            points: pointsMap[applicant.email] || 0
          }))
        );
      } catch (error) {
        console.error('Error flattening applicants:', error);
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [selectedHackathon]);

  const handleColumnToggle = useCallback((column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column) ? prev.filter((col) => col !== column) : [...prev, column],
    );
  }, []);

  const handleFilterAdd = useCallback((selection: FilterRowsSelection) => {
    setFilterSelections(prev => [...prev, selection]);
  }, []);

  const handleFilterRemove = useCallback((filterId: string) => {
    setFilterSelections(prev => prev.filter(filter => filter.id !== filterId));
  }, []);

  const handleFilterOperatorChange = useCallback((filterId: string, operator: 'AND' | 'OR') => {
    setFilterSelections(prev => prev.map(filter =>
      filter.id === filterId ? { ...filter, logicalOperator: operator } : filter
    ));
  }, []);

  const value = {
    hackathons,
    selectedHackathon,
    setSelectedHackathon,
    applicants,
    isLoading,
    selectedColumns,
    groupBySelection,
    filterSelections,
    sorting,
    tableData,
    onColumnToggle: handleColumnToggle,
    onGroupByChange: setGroupBySelection,
    onFilterAdd: handleFilterAdd,
    onFilterRemove: handleFilterRemove,
    onFilterOperatorChange: handleFilterOperatorChange,
    onSortingChange: setSorting,
  };

  return (
    <QueryContext.Provider value={value}>
      {isLoading ? <Loading /> : children}
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
