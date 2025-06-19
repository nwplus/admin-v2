import { cn } from "@/lib/utils";

export function Loading() {
  return (
    <div className={cn("flex h-screen w-screen items-center justify-center bg-background-theme")}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-theme-green border-t-transparent" />
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-theme-green border-t-transparent [animation-delay:0.2s]" />
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-theme-green border-t-transparent [animation-delay:0.4s]" />
        </div>
        <p className="text-lg font-medium text-foreground-theme">Loading...</p>
      </div>
    </div>
  );
} 
