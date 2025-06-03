"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, X } from "lucide-react";
import { forwardRef, useState } from "react";

export interface MultiSelectOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MultiSelect = forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    { options, selected, onChange, placeholder = "Select items...", className, disabled = false },
    ref,
  ) => {
    const [open, setOpen] = useState(false);

    const handleUnselect = (value: string) => {
      onChange(selected.filter((item) => item !== value));
    };

    const handleSelect = (value: string) => {
      if (selected.includes(value)) {
        handleUnselect(value);
      } else {
        onChange([...selected, value]);
      }
    };

    const handleClear = () => {
      onChange([]);
    };

    const selectedOptions = options.filter((option) => selected.includes(option.value));

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            aria-expanded={open}
            className={cn("h-auto min-h-9 w-full justify-between p-1 hover:bg-white", className)}
            disabled={disabled}
          >
            <div className="flex flex-1 flex-wrap items-center gap-1">
              {selected.length === 0 ? (
                <span className="pl-2 font-[400] text-muted-foreground">{placeholder}</span>
              ) : (
                <>
                  {selectedOptions.slice(0, 2).map((option) => (
                    <Badge key={option.value} variant="secondary">
                      {option.icon && <option.icon className="mr-1 h-2 w-2" />}
                      {option.label}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-4 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUnselect(option.value);
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUnselect(option.value);
                        }}
                      >
                        <X className="h-1 w-1 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </Badge>
                  ))}
                  {selected.length > 2 && (
                    <div className="pl-2 font-medium text-xs">+{selected.length - 2} more</div>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selected.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="h-4 w-4 text-muted-foreground hover:bg-transparent"
                >
                  <X className="h-2 w-2" />
                </Button>
              )}
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList
              onWheel={(e) => {
                e.stopPropagation();
              }}
            >
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selected.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleSelect(option.value)}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible",
                        )}
                      >
                        <Check className="h-2 w-2 text-white" />
                      </div>
                      {option.icon && (
                        <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      )}
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
