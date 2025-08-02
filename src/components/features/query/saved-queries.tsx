import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loading } from "@/components/ui/loading";
import { useQuery } from "@/providers/query-provider";
import { toast } from "sonner";
import type { FirebaseQuery } from "@/lib/firebase/types";
import { 
  subscribeToSavedQueries, 
  upsertSavedQuery, 
  deleteSavedQuery 
} from "@/services/saved-queries";

const TABS = {
  BROWSE: "browse",
  CREATE: "create",
} as const;

const VALIDATION_ERRORS = {
  DESCRIPTION_REQUIRED: "Please enter a description for your query",
  DESCRIPTION_MIN_LENGTH: "Description must be at least 3 characters",
  DESCRIPTION_MAX_LENGTH: "Description must be less than 100 characters",
} as const;

type TabValue = typeof TABS[keyof typeof TABS];

interface SavedQueriesProps {
  children: React.ReactNode;
}

interface SaveFormState {
  description: string;
  tags: string;
  isPublic: boolean;
}

interface ValidationError {
  field: keyof SaveFormState;
  message: string;
}

/**
 * helper to validate form data
 */
function validateSaveForm(form: SaveFormState): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!form.description.trim()) {
    errors.push({ field: 'description', message: VALIDATION_ERRORS.DESCRIPTION_REQUIRED });
  } else if (form.description.trim().length < 3) {
    errors.push({ field: 'description', message: VALIDATION_ERRORS.DESCRIPTION_MIN_LENGTH });
  } else if (form.description.trim().length > 100) {
    errors.push({ field: 'description', message: VALIDATION_ERRORS.DESCRIPTION_MAX_LENGTH });
  }
  
  return errors;
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
  const [selectedTab, setSelectedTab] = useState<TabValue>(TABS.BROWSE);
  const [savedQueries, setSavedQueries] = useState<FirebaseQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [saveForm, setSaveForm] = useState<SaveFormState>({
    description: "",
    tags: "",
    isPublic: false,
  });
  const [isSaving, setIsSaving] = useState(false);

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

  useEffect(() => {
    if (!open) return;

    setIsLoading(true);
    let unsubscribe: (() => void) | null = null;
    
    try {
      unsubscribe = subscribeToSavedQueries((queries) => {
        setSavedQueries(queries);
        setIsLoading(false);
      });
    } catch (error) {
      console.error("Failed to subscribe to saved queries:", error);
      setIsLoading(false);
      toast.error("Failed to load saved queries");
    }

    return () => {
      unsubscribe?.();
    };
  }, [open]);

  const filteredQueries = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return savedQueries.filter(query =>
      query.description?.toLowerCase().includes(searchLower) ||
      query.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }, [savedQueries, searchTerm]);

  const handleApplyQuery = useCallback(async (query: FirebaseQuery) => {
    try {
      filterSelections.forEach(filter => onFilterRemove(filter.id));
      onGroupByChange(undefined);
      onSortingChange([]);
      
      query.filterSelections.forEach(filter => onFilterAdd(filter));
      if (query.groupBySelection) {
        onGroupByChange(query.groupBySelection);
      }
      onSortingChange(query.sorting);
      
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
      toast.success(`Applied query: ${query.description}`);
    } catch (error) {
      toast.error("Failed to apply query");
    }
  }, [filterSelections, onFilterRemove, onGroupByChange, onSortingChange, selectedColumns, onColumnToggle]);

  const handleSaveCurrentQuery = async () => {
    const validationErrors = validateSaveForm(saveForm);
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0].message);
      return;
    }

    setIsSaving(true);
    try {
      const tagsArray = saveForm.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const queryToSave: any = {
        description: saveForm.description.trim(),
        selectedColumns,
        filterSelections,
        sorting,
        isPublic: saveForm.isPublic,
      };

      if (groupBySelection) {
        queryToSave.groupBySelection = groupBySelection;
      }
      
      if (tagsArray.length > 0) {
        queryToSave.tags = tagsArray;
      }

      await upsertSavedQuery(queryToSave);
      
      setSaveForm({
        description: "",
        tags: "",
        isPublic: false,
      });
      
      setSelectedTab(TABS.BROWSE);
      toast.success("Query saved successfully!");
    } catch (error) {
      console.error("Error saving query:", error);
      toast.error("Failed to save query");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuery = useCallback(async (queryId: string) => {
    try {
      setSavedQueries(prev => prev.filter(query => query.id !== queryId));
      
      await deleteSavedQuery(queryId);
      toast.success("Query deleted successfully");
    } catch (error) {
      console.error("Error deleting query:", error);
      toast.error("Failed to delete query");
    }
  }, []);

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

  const hasCurrentQueryData = selectedColumns.length > 0 || 
    filterSelections.length > 0 || 
    groupBySelection || 
    sorting.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkIcon className="h-5 w-5" />
            Saved Queries
          </DialogTitle>
          <DialogDescription>
            Browse, apply, and manage your saved queries.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={selectedTab}
          onValueChange={(value) => setSelectedTab(value as TabValue)}
          className="flex-1 overflow-hidden justify-start"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={TABS.BROWSE}>Browse Queries</TabsTrigger>
            <TabsTrigger value={TABS.CREATE}>Save Current</TabsTrigger>
          </TabsList>
          
          <TabsContent value={TABS.BROWSE} className="h-full flex-1">
            <div className="space-y-4 h-auto">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search queries by description or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    aria-label="Search saved queries"
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-full space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loading />
                  </div>
                ) : filteredQueries.length === 0 ? (
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuery(query.id);
                              }}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              ×
                            </Button>
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

          <TabsContent value={TABS.CREATE} className="space-y-4 overflow-y-auto">
              {!hasCurrentQueryData ? (
                <div className="text-center mt-4 py-8 text-muted-foreground">
                  <p>No query configuration to save.</p>
                  <p className="text-sm">Set up some filters, select columns, or configure sorting first.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Input
                        id="description"
                        placeholder="Ex. Number of RSVP'd hackers"
                        value={saveForm.description}
                        onChange={(e) => setSaveForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        placeholder="e.g. accepted, nwHacks"
                        value={saveForm.tags}
                        onChange={(e) => setSaveForm(prev => ({ ...prev, tags: e.target.value }))}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isPublic"
                        checked={saveForm.isPublic}
                        onCheckedChange={(checked) => setSaveForm(prev => ({ ...prev, isPublic: checked }))}
                      />
                      <Label htmlFor="isPublic">Make this query public (visible to all organizers)</Label>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CodeIcon className="h-4 w-4" />
                      Current Query Preview
                    </div>
                    <div className="bg-muted rounded-md p-4 text-sm font-mono overflow-x-auto max-h-[140px]">
                      <pre className="whitespace-pre-wrap text-muted-foreground">
                        {getCurrentQueryString()}
                      </pre>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSaveCurrentQuery} 
                    className="w-full"
                    disabled={isSaving || !saveForm.description.trim()}
                  >
                    {isSaving ? (
                      <>
                        <div className="mr-2 h-4 w-4">
                          <Loading />
                        </div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Save Current Query
                      </>
                    )}
                  </Button>
                </>
              )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 