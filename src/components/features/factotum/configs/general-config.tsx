import { Label } from "@/components/ui/label";
import type { GeneralConfig } from "@/lib/firebase/types";
import { updateGeneralConfig } from "@/services/factotum";
import EditInput from "../edit-input";

interface GeneralConfigProps {
  data: GeneralConfig | undefined;
}

//refactor into sub components that take a map of parameters
export default function GeneralConfig({ data }: GeneralConfigProps) {
  return (
    <div>
      <Label className="mb-5 font-bold text-black text-xl">General</Label>
      <EditInput
        value={data?.roleIds?.admin || ""}
        path="roleIds.admin"
        label="Admin Role ID"
        onChange={updateGeneralConfig}
      />
      <EditInput
        value={data?.roleIds?.staff || ""}
        path="roleIds.staff"
        label="Staff Role ID"
        onChange={updateGeneralConfig}
      />
      <EditInput
        value={data?.roleIds?.unverified || ""}
        path="roleIds.unverified"
        label="Unverified Role ID"
        onChange={updateGeneralConfig}
      />
      <EditInput
        value={data?.roleIds?.verified || ""}
        path="roleIds.verified"
        label="Verified Role ID"
        onChange={updateGeneralConfig}
      />
      <EditInput
        value={data?.channelIds?.adminConsole || ""}
        path="channelIds.adminConsole"
        label="Admin Console Channel ID"
        onChange={updateGeneralConfig}
      />
      <EditInput
        value={data?.channelIds?.adminLog || ""}
        path="channelIds.adminLog"
        label="Admin Log Channel ID"
        onChange={updateGeneralConfig}
      />
    </div>
  );
}
