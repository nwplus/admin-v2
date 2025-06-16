import { cn } from "@/lib/utils";

export function Loading({ variant = "large" }: { variant?: "small" | "large" }) {
  if (variant === "small") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-10">
        <div className="relative h-16 w-16">
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-theme-green border-t-transparent" />
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-theme-green border-t-transparent [animation-delay:0.2s]" />
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-theme-green border-t-transparent [animation-delay:0.4s]" />
        </div>
        <p className="text-black text-lg text-center">Loading</p>
      </div>
    );
  }

  return (
    <div className={cn("flex h-screen w-screen items-center justify-center bg-background-theme")}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-theme-green border-t-transparent" />
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-theme-green border-t-transparent [animation-delay:0.2s]" />
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-theme-green border-t-transparent [animation-delay:0.4s]" />
        </div>
        <p className="text-lg font-medium text-foreground-theme text-white">Loading...</p>
      </div>
    </div>
  );
} 
