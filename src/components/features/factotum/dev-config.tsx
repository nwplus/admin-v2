

import {  Label } from "@/components/ui/label"
import { useState, useEffect } from "react";
import EditInput from "./edit-input";
import { useFactotum } from "@/providers/factotum-provider";

export default function DevConfig() {
    const [embedColor, setEmbedColor] = useState("#000000");
    const [isSetupComplete, setIsSetupComplete] = useState("false");
    const [adminConsole, setAdminConsole] = useState("111111");
    const [adminLogs, setAdminLogs] = useState("1111111");

    const [incomingTicketsChannel, setIncomingTicketsChannel] = useState("unavailable");
    const [mentorRoleSelection, setMentorRoleSelection] = useState("true");
    const [requestTicketChannel, setRequestTicketChannel] = useState("unavailable");

    const [adminRole, setAdminRole] = useState("1111111");
    const [everyoneRole, setEveryoneRole] = useState("true");
    const [memberRole, setMemberRole] = useState("1111111");
    const [mentorRole, setMentorRole] = useState("1111111");
    const [staffRole, setStaffRole] = useState("1111111");

    const [guestRoleID, setGuestRoleID] = useState("1111111");
    const [isEnabled, setIsEnabled] = useState("true");
    const [welcomeSupportChannel, setWelcomeSupportChannel] = useState("1111111");
    const [hackerRoleID, setHackerRoleID] = useState("1111111");
    const [sponsorRoleID, setSponsorRoleID] = useState("1111111");
    const [mentorRoleID, setMentorRoleID] = useState("1111111");
    const [photographerRoleID, setPhotographerRoleID] = useState("1111111");
    const [volunteerRoleID, setVolunteerRoleID] = useState("1111111");

    const devConfig = useFactotum()

    useEffect(() => {
        if (devConfig) {
            const config = devConfig;
            
            setEmbedColor(config.embedColor || "#000000");
            setIsSetupComplete(config.isSetUpComplete?.toString() || "false");
            setAdminConsole(config.channelIDs?.adminConsole || "111111");
            setAdminLogs(config.channelIDs?.adminLog || "1111111");

            setMentorRoleSelection(config.roleIDs?.mentorRole || "true");

            setAdminRole(config.roleIDs?.adminRole || "1111111");
            setEveryoneRole(config.roleIDs?.everyoneRole || "true");
            setMemberRole(config.roleIDs?.memberRole || "1111111");
            setMentorRole(config.roleIDs?.mentorRole || "1111111");
            setStaffRole(config.roleIDs?.staffRole || "1111111");
            setGuestRoleID(config.verification?.guestRoleID || "1111111");
            setIsEnabled(config.verification?.isEnabled?.toString() || "true");
            setWelcomeSupportChannel(config.verification?.welcomeSupportChannel || "1111111");

            const roles = config.verification?.roles;
            roles?.forEach((role) => {
                if (role.name === "hacker") setHackerRoleID(role.roleId || "11111");
                else if (role.name == "sponsor") setSponsorRoleID(role.roleId || "11111");
                else if (role.name == "mentor") setMentorRoleID(role.roleId || "11111");
                else if (role.name == "photographer") setPhotographerRoleID(role.roleId || "11111");
                else if (role.name == "volunteer") setVolunteerRoleID(role.roleId || "11111");
            })
           
        }
    }, [devConfig]);

    return (
        <div>
            <h1 className="font-bold text-2xl line-height-10 mb-5">Dev Configuration</h1>
            <div className="grid grid-cols-4 gap-20">
                <div>
                    <Label className="text-black text-xl font-bold mb-5">General</Label>
                    <EditInput value={embedColor} label="Embed Color" path="embedColor" onChange={setEmbedColor} />
                    <EditInput value={isSetupComplete} label="isSetupComplete" path = "isSetupComplete" onChange={setIsSetupComplete} />
                    
                    <Label className="text-black text-xl font-bold my-5">Channel IDs</Label>
                    <EditInput value={adminConsole} label="adminConsole" path = "channelIDs.adminConsole" onChange={setAdminConsole} />
                    <EditInput value={adminLogs} label="adminLog" path = "channelIDs.adminLog" onChange={setAdminLogs} />
                    
                </div>

                <div>
                    <Label className="text-black text-xl font-bold mb-5">Mentor Tickets</Label>
                    <EditInput value={incomingTicketsChannel} label="incomingTicketsChannel" path ="" onChange={setIncomingTicketsChannel} />
                    <EditInput value={mentorRoleSelection} label="mentorRoleSelection" path="" onChange={setMentorRoleSelection} />
                    <EditInput value={requestTicketChannel} label="requestTicketChannel" path ="" onChange={setRequestTicketChannel} />
                </div>

                <div>
                    <Label className="text-black text-xl font-bold mb-5">Roles</Label>
                    <EditInput value={adminRole} label="adminRole" path="roleIDs.adminRole" onChange={setAdminRole} />
                    <EditInput value={everyoneRole} label="everyoneRole" path="roleIDs.everyoneRole" onChange={setEveryoneRole} />
                    <EditInput value={memberRole} label="memberRole" path="roleIDs.memberRole" onChange={setMemberRole} />
                    <EditInput value={mentorRole} label="mentorRole" path="roleIDs.mentorRole" onChange={setMentorRole} />
                    <EditInput value={staffRole} label="staffRole" path="roleIDs.staffRole" onChange={setStaffRole} />
                </div>

                <div>
                    <Label className="text-black text-xl font-bold mb-5">Verification</Label>
                    <EditInput value={guestRoleID} label="guestRoleID" path="verification.guestRoleID" onChange={setGuestRoleID} />
                    <EditInput value={isEnabled} label="isEnabled" path="roleIDs.isEnabled" onChange={setIsEnabled} />
                    <EditInput value={welcomeSupportChannel} label="welcomeSupportChannel" path="" onChange={setWelcomeSupportChannel} />
                    <EditInput value={hackerRoleID} label="hackerRoleID" path="" onChange={setHackerRoleID} />
                    <EditInput value={sponsorRoleID} label="sponsorRoleID" path="" onChange={setSponsorRoleID} />
                    <EditInput value={mentorRoleID} label="mentorRoleID" path="" onChange={setMentorRoleID} />
                    <EditInput value={photographerRoleID} label="photographerRoleID" path="" onChange={setPhotographerRoleID} />
                    <EditInput value={volunteerRoleID} label="volunteerRoleID" path="" onChange={setVolunteerRoleID} />
                    
                </div>
           

            </div>
        </div>
    )
}