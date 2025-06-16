import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

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
  onApply: (opts: { filterColumn: string; filterCondition: string; filterValue: string }) => void;
}

/**
 * Popover for filtering data based on a selected column and condition.
 * Provides the onApply callback prop to the parent component to notify a new selection.
 */
export function FilterRows({ columns, columnTypes, onApply }: FilterRowsProps) {
  const [open, setOpen] = useState(false);
  const [filterColumn, setFilterColumn] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [filterValue, setFilterValue] = useState("");

  const type = columnTypes[filterColumn] || "string";
  const conditionOptions = CONDITION_OPTIONS[type] || CONDITION_OPTIONS.string;

  const handleApply = () => {
    onApply({ filterColumn, filterCondition, filterValue });
    setOpen(false);
  };

  const handleClear = () => {
    setFilterColumn("");
    setFilterCondition("");
    setFilterValue("");
    onApply({ filterColumn: "", filterCondition: "", filterValue: "" });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal">
          {filterColumn
            ? `Filter: ${filterColumn} ${filterCondition} ${filterValue}`
            : <span className="text-muted-foreground">Add filter...</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit">
        <div className="flex items-center gap-2">
          <span className="mr-1 text-sm">Where</span>
          <Select value={filterColumn} onValueChange={col => { setFilterColumn(col); setFilterCondition(""); setFilterValue(""); }}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Select Column" />
            </SelectTrigger>
            <SelectContent>
              {columns.map(col => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCondition} onValueChange={setFilterCondition} disabled={!filterColumn}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              {conditionOptions.map((opt: { value: string; label: string }) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            className="min-w-[120px] rounded border px-2 py-1 text-sm"
            placeholder="Enter value…"
            value={filterValue}
            onChange={e => setFilterValue(e.target.value)}
            disabled={!filterCondition}
          />
          <div className="flex items-center">
            <Button size="icon" variant="ghost" onClick={handleClear} disabled={!filterColumn && !filterCondition && !filterValue}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleApply} disabled={!(filterColumn && filterCondition && filterValue)}>
              ✓
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 