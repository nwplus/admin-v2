import { Label } from "@/components/ui/label";
import type { VerificationConfig } from "@/lib/firebase/types";
import { updateVerificationConfig } from "@/services/factotum";
import EditInput from "../edit-input";

interface VerificationConfigProps {
  data: VerificationConfig | undefined;
}

//refactor into sub components that take a map of parameters
export default function VerificationConfig({ data }: VerificationConfigProps) {
  return (
    <div>
      <Label className="mb-5 font-bold text-black text-xl">Verification</Label>
      <EditInput
        value={data?.roleIds?.hacker || ""}
        path="roleIds.hacker"
        label="Hacker Role ID"
        onChange={updateVerificationConfig}
      />
      <EditInput
        value={data?.roleIds?.mentor || ""}
        path="roleIds.mentor"
        label="Mentor Role ID"
        onChange={updateVerificationConfig}
      />
      <EditInput
        value={data?.roleIds?.organizer || ""}
        path="roleIds.organizer"
        label="Organizer Role ID"
        onChange={updateVerificationConfig}
      />
      <EditInput
        value={data?.roleIds?.photographer || ""}
        path="roleIds.photographer"
        label="Photographer Role ID"
        onChange={updateVerificationConfig}
      />
      <EditInput
        value={data?.roleIds?.sponsor || ""}
        path="roleIds.sponsor"
        label="Sponsor Role ID"
        onChange={updateVerificationConfig}
      />
      <EditInput
        value={data?.roleIds?.volunteer || ""}
        path="roleIds.volunteer"
        label="Volunteer Role ID"
        onChange={updateVerificationConfig}
      />
    </div>
  );
}
