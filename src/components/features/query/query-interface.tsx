import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useState, useCallback, useEffect, useMemo } from "react";
import { QueryFilters } from "./query-filters";
import { QueryTable } from "./query-table";
import { Download, FileBarChart } from "lucide-react";
import type { Hackathon, Applicant } from "@/lib/firebase/types";
import { subscribeToHackathons } from "@/lib/firebase/firestore";
import { subscribeToApplicants, flattenApplicantData, getAvailableColumns } from "@/services/query";
import type { SortingState } from "@tanstack/react-table";

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

/**
 * Users can sort the data based on a column and a direction.
 * This interface represents this selection. 
 * TODO: Not implemented yet.
 */
export interface SortSelection {
  sortColumn: string;
  sortDirection: "asc" | "desc";
}

interface QueryInterfaceProps {
  onExport?: (data: any[], hackathon: string) => void;
  onRaffle?: (data: any[], hackathon: string) => void;
}

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

export function QueryInterface({
  onExport,
  onRaffle,
}: QueryInterfaceProps) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<string>("");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  
  const availableColumns = useMemo(() => getAvailableColumns(), []);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_SELECTED_COLUMNS);
  const [groupBySelection, setGroupBySelection] = useState<GroupBySelection | undefined>(undefined);
  const [filterSelection, setFilterSelection] = useState<FilterRowsSelection | undefined>(undefined);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    const unsubscribe = subscribeToHackathons((hackathonsData) => {
      setHackathons(hackathonsData);
      // Auto-select the latest hackathon if none selected
      if (hackathonsData.length > 0 && !selectedHackathon) {
        setSelectedHackathon(hackathonsData[hackathonsData.length - 2]._id);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [selectedHackathon]);

  useEffect(() => {
    if (!selectedHackathon) {
      setApplicants([]);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToApplicants(selectedHackathon, (applicantsData) => {
      setApplicants(applicantsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [selectedHackathon]);

  const tableData = useMemo(() => {
    return applicants.map(flattenApplicantData);
  }, [applicants]);

  const handleColumnToggle = useCallback((column: string) => {
    setSelectedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  }, []);

  const handleExport = useCallback(() => {
    try {
      onExport?.(tableData, selectedHackathon);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [onExport, tableData, selectedHackathon]);

  const handleRaffle = useCallback(() => {
    try {
      onRaffle?.(tableData, selectedHackathon);
    } catch (error) {
      console.error('Raffle failed:', error);
    }
  }, [onRaffle, tableData, selectedHackathon]);

  if (loading && hackathons.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hackathons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="max-w-full overflow-x-scroll">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Select value={selectedHackathon} onValueChange={setSelectedHackathon}>
                    <SelectTrigger className="w-auto border-none shadow-none p-0 h-auto">
                      <span className="text-lg sm:text-xl font-semibold truncate max-w-[200px]" title={selectedHackathon || "Select Hackathon"}>
                        {selectedHackathon || "Select Hackathon"}
                      </span>
                    </SelectTrigger>
                    <SelectContent align="start">
                      {hackathons.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No hackathons available
                        </SelectItem>
                      ) : (
                        hackathons.map((hackathon) => (
                          <SelectItem key={hackathon._id} value={hackathon._id}>
                            {hackathon._id}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedHackathon && (
                  <div className="text-xs text-gray-500">
                    {applicants.length} Applicants
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {onRaffle && selectedHackathon && (
                  <Button 
                    variant="default" 
                    className="bg-slate-700 hover:bg-slate-800 w-full sm:w-auto"
                    onClick={handleRaffle}
                    disabled={applicants.length === 0}
                    size="sm"
                  >
                    <FileBarChart className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{selectedHackathon} Raffle</span>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={handleExport}
                  disabled={applicants.length === 0}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                  Export
                </Button>
              </div>
            </div>

            {selectedHackathon ? (
              <div className="space-y-4 mt-6">
                <QueryFilters
                  selectedColumns={selectedColumns}
                  availableColumns={availableColumns}
                  onColumnToggle={handleColumnToggle}
                  tableData={tableData}
                  onGroupByChange={setGroupBySelection}
                  onFilterChange={setFilterSelection}
                  sorting={sorting}
                  setSorting={setSorting}
                />

                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-600 text-sm">Loading applicants...</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full overflow-hidden">
                    <QueryTable
                      data={tableData}
                      selectedColumns={selectedColumns}
                      groupBySelection={groupBySelection}
                      filterSelection={filterSelection}
                      sorting={sorting}
                      onSortingChange={setSorting}
                    />
                  </div>
                )}
              </div>
            ) : (
              // TODO:Fallback for when no hackathon is selected, should be impossible
              <div className="text-center py-12 text-gray-500 mt-6">
                <p>Please select a hackathon to view applicant data.</p>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>
    </div>
  );
} 