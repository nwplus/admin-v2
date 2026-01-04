import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { FilterRowsSelection } from "@/lib/firebase/types";
import { Plus, X } from "lucide-react";
import { useState } from "react";

/**
 * Available columns for stamp criteria filtering; corresponds to applicant data fields
 * TODO: hardcoded for now; can fetch from firestore and filter
 */
const AVAILABLE_COLUMNS = [
  { value: "status.applicationStatus", label: "Application Status" },
  { value: "status.attending", label: "Attending" },
  { value: "dayOf.checkedIn", label: "Checked In" },
  { value: "basicInfo.school", label: "School" },
  { value: "basicInfo.graduation", label: "Graduation Year" },
  { value: "basicInfo.educationLevel", label: "Education Level" },
  { value: "skills.numHackathonsAttended", label: "Hackathons Attended" },
];

/**
 * Set of possible operators for filtering rows based on data type, similar to query builder's filter conditions.
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

const COLUMN_TYPES: Record<string, string> = {
  "status.applicationStatus": "string",
  "status.attending": "boolean",
  "dayOf.checkedIn": "boolean",
  "basicInfo.school": "string",
  "basicInfo.graduation": "number",
  "basicInfo.educationLevel": "string",
  "skills.numHackathonsAttended": "string",
};

const getColumnLabel = (value: string) => {
  return AVAILABLE_COLUMNS.find((col) => col.value === value)?.label || value;
};

interface CriteriaBuilderProps {
  criteria: FilterRowsSelection[];
  onChange: (criteria: FilterRowsSelection[]) => void;
}

export function CriteriaBuilder({ criteria, onChange }: CriteriaBuilderProps) {
  const [open, setOpen] = useState(false);
  const [newFilterColumn, setNewFilterColumn] = useState("");
  const [newFilterCondition, setNewFilterCondition] = useState("");
  const [newFilterValue, setNewFilterValue] = useState("");
  const [newFilterOperator, setNewFilterOperator] = useState<"AND" | "OR">("AND");

  const type = COLUMN_TYPES[newFilterColumn] || "string";
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
      onChange([...criteria, newFilter]);
      setNewFilterColumn("");
      setNewFilterCondition("");
      setNewFilterValue("");
      setNewFilterOperator("AND");
    }
  };

  const handleRemoveFilter = (filterId: string) => {
    onChange(criteria.filter((f) => f.id !== filterId));
  };

  const handleOperatorChange = (filterId: string, operator: "AND" | "OR") => {
    onChange(
      criteria.map((f) => (f.id === filterId ? { ...f, logicalOperator: operator } : f)),
    );
  };

  const getFilterDisplayText = (filter: FilterRowsSelection) => {
    const conditionLabel =
      CONDITION_OPTIONS[COLUMN_TYPES[filter.filterColumn] || "string"]?.find(
        (opt) => opt.value === filter.filterCondition,
      )?.label || filter.filterCondition;
    return `${getColumnLabel(filter.filterColumn)} ${conditionLabel} ${filter.filterValue}`;
  };

  const getFilterLogicDisplay = () => {
    if (criteria.length === 0) return "";

    return criteria
      .map((filter, index) => {
        const filterText = getFilterDisplayText(filter);
        const operator = filter.logicalOperator || "AND";

        if (index === 0) return filterText;
        return ` ${operator} ${filterText}`;
      })
      .join("");
  };

  return (
    <div className="space-y-2">
      <Label>Unlock Criteria (optional)</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="w-full justify-between font-normal">
              <span>
                {criteria.length > 0 ? (
                  <span className="font-medium text-neutral-700">
                    {criteria.length} condition{criteria.length !== 1 ? "s" : ""} set
                  </span>
                ) : (
                  <span className="text-muted-foreground">Add unlock criteria...</span>
                )}
              </span>
            </Button>
            {criteria.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="cursor-pointer">
                    {criteria.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">Unlock Criteria:</p>
                    <div className="font-mono text-xs">{getFilterLogicDisplay()}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-fit">
          {criteria.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Active Criteria</h4>
              <div className="space-y-2">
                {criteria.map((filter, index) => (
                  <div key={filter.id} className="flex items-center gap-2">
                    {index > 0 && (
                      <Select
                        value={filter.logicalOperator || "AND"}
                        onValueChange={(value: "AND" | "OR") =>
                          handleOperatorChange(filter.id, value)
                        }
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
                        type="button"
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
            <h4 className="font-medium text-sm">Add New Condition</h4>
            <div className="space-y-2">
              {criteria.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">Connect with:</span>
                  <Select
                    value={newFilterOperator}
                    onValueChange={(value: "AND" | "OR") => setNewFilterOperator(value)}
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
                  onValueChange={(col) => {
                    setNewFilterColumn(col);
                    setNewFilterCondition("");
                    setNewFilterValue("");
                  }}
                >
                  <SelectTrigger className="min-w-[180px]">
                    <SelectValue placeholder="Select Field" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_COLUMNS.map((col) => (
                      <SelectItem key={col.value} value={col.value}>
                        {col.label}
                      </SelectItem>
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
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="max-w-[160px] text-sm"
                  placeholder="Enter value…"
                  value={newFilterValue}
                  onChange={(e) => setNewFilterValue(e.target.value)}
                  disabled={!newFilterCondition}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleAddFilter}
                  disabled={!(newFilterColumn && newFilterCondition && newFilterValue)}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <p className="text-neutral-500 text-xs">
        Define conditions for auto-unlocking this stamp based on user data.
      </p>
    </div>
  );
}

