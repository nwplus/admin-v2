import { useState } from "react";
import { PlusIcon, BookmarkIcon, SearchIcon, TagIcon, CalendarIcon, UserIcon, CodeIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@/providers/query-provider";
import type { FirebaseQuery } from "@/lib/firebase/types";

interface SavedQueriesProps {
  children: React.ReactNode;
}

/**
 * Converts a FirebaseQuery object into a human-readable query string
 */
function parseQueryToString(query: FirebaseQuery): string {
  const parts: string[] = [];

  if (query.selectedColumns.length > 0) {
    parts.push(`SELECT ${query.selectedColumns.join(", ")}`);
  }

  parts.push("FROM applicants");

  if (query.filterSelections.length > 0) {
    const whereConditions = query.filterSelections.map((filter, index) => {
      const operator = getFilterOperatorSymbol(filter.filterCondition);
      const value = isNaN(Number(filter.filterValue)) 
        ? `'${filter.filterValue}'` 
        : filter.filterValue;
      
      let condition = `${filter.filterColumn} ${operator} ${value}`;
      
      if (index > 0) {
        const logicalOp = filter.logicalOperator || 'AND';
        condition = `${logicalOp} ${condition}`;
      }
      
      return condition;
    });
    
    parts.push(`WHERE ${whereConditions.join(" ")}`);
  }

  if (query.groupBySelection) {
    parts.push(`GROUP BY ${query.groupBySelection.groupByColumn}`);
    parts.push(`AGGREGATE ${query.groupBySelection.aggregationFunction}(${query.groupBySelection.aggregationColumn})`);
  }

  if (query.sorting.length > 0) {
    const orderConditions = query.sorting.map(sort => 
      `${sort.id} ${sort.desc ? 'DESC' : 'ASC'}`
    );
    parts.push(`ORDER BY ${orderConditions.join(", ")}`);
  }

  return parts.join("\n");
}

/**
 * Converts filter condition to operator symbol
 */
function getFilterOperatorSymbol(condition: string): string {
  switch (condition) {
    case "equals":
      return "=";
    case "not_equals":
      return "!=";
    case "greater_than":
      return ">";
    case "less_than":
      return "<";
    case "matches":
      return "LIKE";
    case "does_not_match":
      return "NOT LIKE";
    default:
      return condition;
  }
}

/**
 * Dialog to display saved queries
 */
export function SavedQueries({ children }: SavedQueriesProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("browse");
  
  // TODO: replace with actual Firebase data
  const [savedQueries] = useState<FirebaseQuery[]>([
          {
        id: "1",
        description: "Blacklisted applicants",
        selectedColumns: ["firstName", "school", "major", "totalScore"],
        filterSelections: [
          {
            id: "f1",
            filterColumn: "totalScore",
            filterCondition: "less_than",
            filterValue: "0",
          },
        ],
        groupBySelection: undefined,
        sorting: [],
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        createdBy: "user123",
        isPublic: true,
        tags: ["applicants"],
      },
    {
      id: "2", 
      description: "All accepted applicants",
      selectedColumns: ["firstName", "email", "major", "totalScore"],
      filterSelections: [
        {
          id: "f3",
          filterColumn: "applicationStatus",
          filterCondition: "equals",
          filterValue: "acceptedNoResponseYet",
        },
      ],
      groupBySelection: undefined,
      sorting: [{ id: "totalScore", desc: true }],
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-12"),
      createdBy: "user456",
      isPublic: false,
      tags: ["accepted", "final"],
    },
  ]);

  const {
    selectedColumns,
    filterSelections,
    groupBySelection,
    sorting,
    onColumnToggle,
    onFilterAdd,
    onFilterRemove,
    onGroupByChange,
    onSortingChange,
  } = useQuery();

  const filteredQueries = savedQueries.filter(query =>
    query.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    query.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleApplyQuery = (query: FirebaseQuery) => {
    filterSelections.forEach(filter => onFilterRemove(filter.id));
    onGroupByChange(undefined);
    onSortingChange([]);
    
    // TO-DO: need to optimize the provider to handle bulk updates more efficiently
    query.filterSelections.forEach(filter => onFilterAdd(filter));
    if (query.groupBySelection) {
      onGroupByChange(query.groupBySelection);
    }
    onSortingChange(query.sorting);
    
    // TO-DO: need to add/remove columns to match the saved selection
    const currentColumns = new Set(selectedColumns);
    const targetColumns = new Set(query.selectedColumns);
    
    selectedColumns.forEach(col => {
      if (!targetColumns.has(col)) {
        onColumnToggle(col);
      }
    });
    
    query.selectedColumns.forEach(col => {
      if (!currentColumns.has(col)) {
        onColumnToggle(col);
      }
    });
    
    setOpen(false);
  };

  const handleSaveCurrentQuery = () => {
    // TODO: Create a new FirebaseQuery from current state
    console.log("Save current query:", {
      selectedColumns,
      filterSelections,
      groupBySelection,
      sorting,
    });
  };

  const getCurrentQueryString = (): string => {
    const currentQuery: FirebaseQuery = {
      id: "current",
      description: "Current Query",
      selectedColumns,
      filterSelections,
      groupBySelection: groupBySelection || undefined,
      sorting,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "current-user",
      isPublic: false,
    };
    return parseQueryToString(currentQuery);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkIcon className="h-5 w-5" />
            Saved Queries
          </DialogTitle>
          <DialogDescription>
            Browse, apply, and manage your saved query configurations
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Queries</TabsTrigger>
            <TabsTrigger value="create">Save Current</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="flex-1 overflow-hidden">
            <div className="space-y-4 h-full">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search queries by description or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-[500px] space-y-3">
                {filteredQueries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No queries match your search" : "No saved queries yet"}
                  </div>
                ) : (
                  filteredQueries.map((query) => (
                    <Card key={query.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{query.description}</CardTitle>
                          <div className="flex items-center gap-1">
                            {query.isPublic && (
                              <Badge variant="secondary" className="text-xs">
                                Public
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3" />
                            {query.createdBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {query.createdAt.toLocaleDateString()}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-3 space-y-3">
                        {/* Raw Query String */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <CodeIcon className="h-3 w-3" />
                            Query Preview
                          </div>
                          <div className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto">
                            <pre className="whitespace-pre-wrap text-muted-foreground">
                              {parseQueryToString(query)}
                            </pre>
                          </div>
                        </div>
                        
                        {/* Tags */}
                        {query.tags && query.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <TagIcon className="h-3 w-3 text-muted-foreground" />
                            <div className="flex gap-1 flex-wrap">
                              {query.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="pt-0">
                        <Button 
                          onClick={() => handleApplyQuery(query)}
                          className="w-full"
                          size="sm"
                        >
                          Apply Query
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="py-6">
              <h3 className="text-lg font-semibold mb-2">Save Current Query</h3>
              <p className="text-muted-foreground mb-6">
                Save your current filter, column, and sort configuration for future use
              </p>
              
              {/* Current Query Preview */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CodeIcon className="h-4 w-4" />
                  Current Query Preview
                </div>
                <div className="bg-muted rounded-md p-4 text-sm font-mono overflow-x-auto">
                  <pre className="whitespace-pre-wrap text-muted-foreground">
                    {getCurrentQueryString()}
                  </pre>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <strong>Current Configuration Summary:</strong>
                </div>
                <div>• Columns: {selectedColumns.join(", ") || "None selected"}</div>
                <div>• Filters: {filterSelections.length} condition(s)</div>
                {groupBySelection && (
                  <div>• Grouped by: {groupBySelection.groupByColumn}</div>
                )}
                <div>• Sorting: {sorting.length} column(s)</div>
              </div>

              <Separator className="my-6" />
              
              <Button onClick={handleSaveCurrentQuery} className="w-full">
                <PlusIcon className="h-4 w-4 mr-2" />
                Save Current Query
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 