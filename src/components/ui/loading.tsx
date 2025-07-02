import { cn } from "@/lib/utils";

export function Loading({ isFullScreen = false }: { isFullScreen?: boolean }) {
  const containerClasses = isFullScreen
    ? "flex h-screen w-screen items-center justify-center bg-background-theme"
    : "flex h-full w-full flex-col items-center justify-center gap-10";

  const textClasses = isFullScreen
    ? "font-medium text-foreground-theme text-lg"
    : "text-center text-black text-lg";

  return (
    <div className={cn(containerClasses)}>
      <div className={cn(isFullScreen ? "flex flex-col items-center gap-4" : "")}>
        <div className="relative h-16 w-16">
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-theme-green border-t-transparent" />
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-theme-green border-t-transparent [animation-delay:0.2s]" />
          <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-theme-green border-t-transparent [animation-delay:0.4s]" />
        </div>
        <p className={textClasses}>Loading</p>
      </div>
    </div>
  );
}
