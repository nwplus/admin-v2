import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { FilterRowsSelection } from "@/providers/query-provider";

/**
 * Set of possible operators for filtering rows based on data type.
 */
const CONDITION_OPTIONS: Record<string, { value: string; label: string }[]> = {
  string: [
    { value: "matches", label: "matches" },
    { value: "does_not_match", label: "does not match" },
    { value: "equals", label: "equals" },
    { value: "not_equals", label: "is not equal to" },
  ],
  number: [
    { value: "equals", label: "equals" },
    { value: "not_equals", label: "is not equal to" },
    { value: "greater_than", label: "greater than" },
    { value: "less_than", label: "less than" },
  ],
  boolean: [
    { value: "equals", label: "equals" },
    { value: "not_equals", label: "is not equal to" },
  ],
};

interface FilterRowsProps {
  columns: string[];
  columnTypes: Record<string, string>;
  filterSelections: FilterRowsSelection[];
  onAddFilter: (filter: FilterRowsSelection) => void;
  onRemoveFilter: (filterId: string) => void;
  onFilterOperatorChange: (filterId: string, operator: 'AND' | 'OR') => void;
}

/**
 * Popover for filtering data based on clauses of the form 'column-operator-value'.
 * Provides the onApply callback prop to the parent component to notify a new selection.
 */
export function FilterRows({ 
  columns, 
  columnTypes, 
  filterSelections, 
  onAddFilter, 
  onRemoveFilter,
  onFilterOperatorChange
}: FilterRowsProps) {
  const [open, setOpen] = useState(false);
  const [newFilterColumn, setNewFilterColumn] = useState("");
  const [newFilterCondition, setNewFilterCondition] = useState("");
  const [newFilterValue, setNewFilterValue] = useState("");
  const [newFilterOperator, setNewFilterOperator] = useState<'AND' | 'OR'>('AND');

  const type = columnTypes[newFilterColumn] || "string";
  const conditionOptions = CONDITION_OPTIONS[type] || CONDITION_OPTIONS.string;

  const handleAddFilter = () => {
    if (newFilterColumn && newFilterCondition && newFilterValue) {
      const newFilter: FilterRowsSelection = {
        id: crypto.randomUUID(),
        filterColumn: newFilterColumn,
        filterCondition: newFilterCondition,
        filterValue: newFilterValue,
        logicalOperator: newFilterOperator,
      };
      onAddFilter(newFilter);
      setNewFilterColumn("");
      setNewFilterCondition("");
      setNewFilterValue("");
      setNewFilterOperator('AND');
    }
  };

  const handleRemoveFilter = (filterId: string) => {
    onRemoveFilter(filterId);
  };

  const getFilterDisplayText = (filter: FilterRowsSelection) => {
    const conditionLabel = CONDITION_OPTIONS[columnTypes[filter.filterColumn] || "string"]
      ?.find(opt => opt.value === filter.filterCondition)?.label || filter.filterCondition;
    return `${filter.filterColumn} ${conditionLabel} ${filter.filterValue}`;
  };

  const getFilterLogicDisplay = () => {
    if (filterSelections.length === 0) return "";
    
    return filterSelections.map((filter, index) => {
      const filterText = getFilterDisplayText(filter);
      const operator = filter.logicalOperator || 'AND';
      
      if (index === 0) return filterText;
      return ` ${operator} ${filterText}`;
    }).join('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="w-full justify-between font-normal">
            <span>
              {filterSelections.length > 0 
                ? <span className="font-medium text-neutral-700">
                    {filterSelections.length} filter{filterSelections.length !== 1 ? 's' : ''} applied
                  </span>
                : <span className="text-muted-foreground">
                    Add filter...
                  </span>
              }
            </span>
          </Button>
          {filterSelections.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="cursor-pointer">
                  {filterSelections.length} filter{filterSelections.length !== 1 ? 's' : ''}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">Active Filters:</p>
                  <div className="font-mono text-xs">
                    {getFilterLogicDisplay()}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-fit">
        {filterSelections.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Active Filters</h4>
            <div className="space-y-2">
              {filterSelections.map((filter, index) => (
                <div key={filter.id} className="flex items-center gap-2">
                  {index > 0 && (
                    <Select
                      value={filter.logicalOperator || 'AND'}
                      onValueChange={(value: 'AND' | 'OR') => onFilterOperatorChange(filter.id, value)}
                    >
                      <SelectTrigger className="h-8 w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex flex-1 items-center gap-2 rounded-md bg-muted p-2">
                    <span className="flex-1 px-2 text-xs">
                      {getFilterDisplayText(filter)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveFilter(filter.id)}
                      className="h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-sm">Add New Filter</h4>
          <div className="space-y-2">
            {filterSelections.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm">Connect with:</span>
                <Select
                  value={newFilterOperator}
                  onValueChange={(value: 'AND' | 'OR') => setNewFilterOperator(value)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="mr-1 text-sm">Where</span>
              <Select 
                value={newFilterColumn} 
                onValueChange={col => { 
                  setNewFilterColumn(col); 
                  setNewFilterCondition(""); 
                  setNewFilterValue(""); 
                }}
              >
                <SelectTrigger className="min-w-[160px]">
                  <SelectValue placeholder="Select Column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                value={newFilterCondition} 
                onValueChange={setNewFilterCondition} 
                disabled={!newFilterColumn}
              >
                <SelectTrigger className="min-w-[150px]">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  {conditionOptions.map((opt: { value: string; label: string }) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="max-w-[160px] text-sm"
                placeholder="Enter value…"
                value={newFilterValue}
                onChange={e => setNewFilterValue(e.target.value)}
                disabled={!newFilterCondition}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleAddFilter}
                disabled={!(newFilterColumn && newFilterCondition && newFilterValue)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}