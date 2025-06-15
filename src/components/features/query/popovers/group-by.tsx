import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface GroupByProps {
  groupableColumns: string[];
  aggregatableColumnsMap: Record<string, string[]>;
  onApply: (opts: { groupByColumn: string; aggregationFunction: string; aggregationColumn: string } | undefined) => void;
}

/**
 * Popover for grouping data based on a selected attribute and using this 
 * to apply an aggregation function to another attribute.
 * 
 * Provides the onApply callback prop to the parent component to notify a new selection.
 */
export function GroupBy({ groupableColumns, aggregatableColumnsMap, onApply }: GroupByProps) {
  const [open, setOpen] = useState(false);
  const [groupByColumn, setGroupByColumn] = useState("");
  const [aggregationFunction, setAggregationFunction] = useState("COUNT");
  const [aggregationColumn, setAggregationColumn] = useState("");

  const aggregationOptions = ["COUNT", "SUM", "AVERAGE", "MIN", "MAX"];
  const aggregationColumnOptions = aggregatableColumnsMap[aggregationFunction] || [];

  const handleApply = () => {
    onApply({ groupByColumn, aggregationFunction, aggregationColumn });
    setOpen(false);
  };

  const handleClear = () => {
    setGroupByColumn("");
    setAggregationFunction("COUNT");
    setAggregationColumn("");
    onApply(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full font-normal justify-between">
          {groupByColumn
            ? `Group by: ${groupByColumn}`
            : <span className="text-muted-foreground">Select a column to group by...</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit">
        <div className="flex gap-2 items-center">
          <Select value={groupByColumn} onValueChange={setGroupByColumn}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Group by column" />
            </SelectTrigger>
            <SelectContent>
              {groupableColumns.map(col => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={aggregationFunction} onValueChange={fn => { setAggregationFunction(fn); setAggregationColumn(""); }}>
            <SelectTrigger className="min-w-[120px]">
              <SelectValue placeholder="Function" />
            </SelectTrigger>
            <SelectContent>
              {aggregationOptions.map(fn => (
                <SelectItem key={fn} value={fn}>{fn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={aggregationColumn} onValueChange={setAggregationColumn}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Aggregate column" />
            </SelectTrigger>
            <SelectContent>
              {aggregationColumnOptions.map(col => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center">
            <Button size="icon" variant="ghost" onClick={handleClear} disabled={!groupByColumn && !aggregationFunction && !aggregationColumn}>
              <X className="w-4 h-4" />
            </Button>
          <Button size="icon" variant="ghost" onClick={handleApply} disabled={!(groupByColumn && aggregationFunction && aggregationColumn)}>
              ✓
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 