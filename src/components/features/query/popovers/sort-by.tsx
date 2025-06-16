import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import type { SortingState } from "@tanstack/react-table";

interface SortByProps {
  columns: string[];
  sorting: SortingState;
  setSorting: (updater: SortingState | ((prev: SortingState) => SortingState)) => void;
}

/**
 * Popover for single column sorting.
 * Note that the sorting state is kept in sync with the tanstack table API. 
 */
export function SortBy({ columns, sorting, setSorting }: SortByProps) {
  const [open, setOpen] = useState(false);
  const currentSort = sorting[0] || { id: "", desc: false };
  const [sortColumn, setSortColumn] = useState(currentSort.id || "");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(currentSort.desc ? "desc" : "asc");

  // Keep local state in sync with external sorting
  useEffect(() => {
    setSortColumn(currentSort.id || "");
    setSortDirection(currentSort.desc ? "desc" : "asc");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSort.id, currentSort.desc]);

  const handleApply = () => {
    setSorting(sortColumn ? [{ id: sortColumn, desc: sortDirection === "desc" }] : []);
    setOpen(false);
  };

  const handleClear = () => {
    setSortColumn("");
    setSortDirection("asc");
    setSorting([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal">
          {sortColumn
            ? `Sort: ${sortColumn} (${sortDirection})`
            : <span className="text-muted-foreground">Sort by...</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit">
        <div className="flex items-center gap-2">
          <span className="mr-1 text-sm">Sort by</span>
          <Select value={sortColumn} onValueChange={setSortColumn}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Select Column" />
            </SelectTrigger>
            <SelectContent>
              {columns.map(col => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortDirection} onValueChange={v => setSortDirection(v as "asc" | "desc") }>
            <SelectTrigger className="min-w-[120px]">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center">
            <Button size="icon" variant="ghost" onClick={handleClear} disabled={!sortColumn}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleApply} disabled={!sortColumn}>
              ✓
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}