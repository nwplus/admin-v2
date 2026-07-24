import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const search = value.trim().toLowerCase();
  const filtered = search ? options.filter((o) => o.toLowerCase().startsWith(search)) : options;
  const showDropdown = open && filtered.length > 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset highlight when the search term changes
  useEffect(() => {
    setHighlight(0);
  }, [search]);

  const pick = (item: string) => {
    onChange(item);
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === "ArrowDown" && filtered.length > 0) setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlight]) pick(filtered[highlight]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor>
        <Input
          ref={inputRef}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          className={className}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => {
              if (!inputRef.current?.contains(document.activeElement)) setOpen(false);
            }, 0);
          }}
          onKeyDown={onKeyDown}
        />
      </PopoverAnchor>
      {filtered.length > 0 && (
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-1"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => {
            if (inputRef.current?.contains(e.target as Node)) e.preventDefault();
          }}
          onFocusOutside={(e) => {
            if (inputRef.current?.contains(e.target as Node)) e.preventDefault();
          }}
        >
          <div className="max-h-60 overflow-y-auto">
            {filtered.map((opt, i) => (
              <button
                type="button"
                key={opt}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(opt);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-left text-sm",
                  i === highlight ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}
