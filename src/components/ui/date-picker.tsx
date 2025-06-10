import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Matcher } from "react-day-picker";
import { Input } from "./input";

interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  format?: string;
  className?: string;
  showTimePicker?: boolean;
  disableBefore?: Date;
  disableAfter?: Date;
}

export function DatePicker({
  value,
  onChange,
  format: dateFormat = "PPP",
  className,
  showTimePicker = true,
  disableBefore,
  disableAfter,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | null | undefined>(value);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(null);
      if (onChange) onChange(null);
      return;
    }

    if (date) {
      selectedDate.setHours(date.getHours());
      selectedDate.setMinutes(date.getMinutes());
    }

    setDate(selectedDate);
    if (onChange) onChange(selectedDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!date || !e.target.value) return;

    const [hours, minutes] = e.target.value.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);

    setDate(newDate);
    if (onChange) onChange(newDate);
  };

  const timeValue = date
    ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
    : "";

  const disabledMatcher: Matcher | undefined =
    disableBefore || disableAfter
      ? ({
          before: disableBefore,
          after: disableAfter,
        } as Matcher)
      : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, showTimePicker ? `${dateFormat} p` : dateFormat)
          ) : (
            <span>Pick a date{showTimePicker ? " and time" : ""}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date || undefined}
          onSelect={handleSelect}
          initialFocus
          disabled={disabledMatcher}
        />

        {showTimePicker && (
          <div className="border-border border-t p-2">
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="w-full rounded-md border border-input bg-background p-1 text-sm"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
