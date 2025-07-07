import { useFactotum } from "@/providers/factotum-provider";
import GeneralConfig from "./configs/general-config";
import TicketsConfig from "./configs/ticket-config";
import VerificationConfig from "./configs/verification-config";
export default function DevConfig() {
  const { generalConfig, ticketsConfig, verificationConfig } = useFactotum();

  return (
    <div>
      <h1 className="line-height-10 mb-5 font-bold text-2xl">Dev Configuration</h1>
      <div className="grid grid-cols-3 gap-20">
        <GeneralConfig data={generalConfig} />
        <TicketsConfig data={ticketsConfig} />
        <VerificationConfig data={verificationConfig} />
      </div>
    </div>
  );
}
