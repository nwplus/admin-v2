import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<
  ApplicationStatus,
  {
    label: string;
    color: string;
  }
> = {
  inProgress: {
    label: "In Progress",
    color: "bg-blue-500",
  },
  applied: {
    label: "Applied",
    color: "",
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
    color: "",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-600",
  },
  waitlisted: {
    label: "Waitlisted",
    color: "",
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
