import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
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
  size = "default",
  description,
  children,
  className,
  sideEffect,
  onConfirm,
}: {
  header?: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
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
