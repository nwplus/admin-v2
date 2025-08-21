import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";

export const STATUS_LABEL: Record<
  ApplicationStatus,
  {
    label: string;
    color: string;
  }
> = {
  inProgress: {
    label: "In Progress",
    color: "",
  },
  applied: {
    label: "Ungraded",
    color: "bg-neutral-400",
  },
  completed: {
    label: "Completed",
    color: "",
  },
  gradinginprog: {
    label: "Grading",
    color: "bg-theme",
  },
  scored: {
    label: "Scored",
    color: "bg-blue-500",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-600",
  },
  waitlisted: {
    label: "Waitlisted",
    color: "bg-orange-500",
  },
  acceptedNoResponseYet: {
    label: "Accepted",
    color: "bg-green-500",
  },
  acceptedAndAttending: {
    label: "Accepted",
    color: "bg-green-500",
  },
  acceptedUnRSVP: {
    label: "Accepted ",
    color: "bg-green-500",
  },
};

export function ApplicantStatus({
  status,
}: {
  status: ApplicationStatus;
}) {
  return (
    <Badge className={cn(STATUS_LABEL[status]?.color)}>
      {STATUS_LABEL[status]?.label ?? `Unknown - ${status}`}
    </Badge>
  );
}
