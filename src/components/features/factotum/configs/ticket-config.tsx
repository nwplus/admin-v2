import { Label } from "@/components/ui/label";
import type { TicketsConfig } from "@/lib/firebase/types";
import { updateTicketsConfig } from "@/services/factotum";
import EditInput from "../edit-input";

interface TicketsConfigProps {
  data: TicketsConfig | undefined;
}

//refactor into sub components that take a map of parameters
export default function TicketsConfig({ data }: TicketsConfigProps) {
  return (
    <div>
      <Label className="mb-5 font-bold text-black text-xl">Tickets</Label>
      <EditInput
        value={data?.channelIds?.incomingTicketsChannel || ""}
        path="channelIds.incomingTicketsChannel"
        label="Incoming Tickets Channel ID"
        onChange={updateTicketsConfig}
      />
      <EditInput
        value={data?.roleIds?.requestTicketRole || ""}
        path="roleIds.requestTicketRole"
        label="Request Ticket Role ID"
        onChange={updateTicketsConfig}
      />
      <EditInput
        value={data?.savedMessages?.mentorSpecialtySelection?.channelId || ""}
        path="savedMessages.mentorSpecialtySelection.channelId"
        label="Mentor Specialty Selection Channel ID"
        onChange={updateTicketsConfig}
      />
      <EditInput
        value={data?.savedMessages?.requestTicket?.channelId || ""}
        path="savedMessages.requestTicket.channelId"
        label="Request Ticket Channel ID"
        onChange={updateTicketsConfig}
      />
    </div>
  );
}
