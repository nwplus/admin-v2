
import { useFactotum } from "@/providers/factotum-provider";
import GeneralConfig from "./configs/general-config";
import TicketsConfig from "./configs/ticket-config";
import VerificationConfig from "./configs/verification-config";
export default function DevConfig() {

    const devConfig = useFactotum()

    const generalConfig = devConfig?.generalConfig;
    const ticketsConfig = devConfig?.ticketsConfig;
    const verificationConfig = devConfig?.verificationConfig;

    return (
        <div>
            <h1 className="font-bold text-2xl line-height-10 mb-5">Dev Configuration</h1>
            <div className="grid grid-cols-3 gap-20">
                <GeneralConfig data = {generalConfig} />
                <TicketsConfig data = {ticketsConfig} />
                <VerificationConfig data = {verificationConfig} />
            </div>
        </div>
    )
}