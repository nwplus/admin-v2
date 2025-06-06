import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { buttonVariants } from "./button";

export function Confirm({
  header,
  variant,
  size = null,
  description,
  children,
  className,
  sideEffect,
  onConfirm,
}: {
  header?: string;
  variant?: "destructive" | "default" | "outline";
  size: "sm" | "default" | "lg" | "icon" | null;
  description?: string;
  className?: string;
  children?: ReactNode;
  sideEffect?: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger className={className} onClick={sideEffect}>
        <div className={cn(buttonVariants({ variant, size }), "w-full")}>{children}</div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{header ?? "Are you sure?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? "This action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
