import { cn } from "@/lib/utils";

export function PageHeader({ className, ...props }: React.ComponentProps<"h1">) {
  return <h1 className={cn("font-bold text-3xl", className)} {...props} />;
}
