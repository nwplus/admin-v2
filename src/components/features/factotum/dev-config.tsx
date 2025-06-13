
import { Label } from "@/components/ui/label"
import { useState } from "react";
import EditInput from "./edit-input";

export default function DevConfig() {


    const [embedColor, setEmbedColor] = useState("#000000");
    const [isSetupComplete, setIsSetupComplete] = useState("false");
    const [adminConsole, setAdminConsole] = useState("111111");
    const [adminLogs, setAdminLogs] = useState("1111111");

    const [incomingTicketsChannel, setIncomingTicketsChannel] = useState("1111111");
    const [mentorRoleSelection, setMentorRoleSelection] = useState("true");
    const [requestTicketChannel, setRequestTicketChannel] = useState("1111111");

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
    const [organizerRoleID, setOrganizerRoleID] = useState("1111111");
    const [photographerRoleID, setPhotographerRoleID] = useState("1111111");
    const [volunteerRoleID, setVolunteerRoleID] = useState("1111111");

    return (
        <div className="w-full">
            <h1 className="font-bold text-2xl line-height-10 mb-5">Dev Configuration</h1>
            <div className="grid grid-cols-4 gap-20">
                <div>
                    <Label className="text-black text-xl font-bold mb-5">General</Label>
                    <EditInput value={embedColor} label="Embed Color" onChange={setEmbedColor} />
                    <EditInput value = {isSetupComplete} label="isSetupComplete" onChange={setIsSetupComplete} />


                    <Label className="text-black text-xl font-bold my-5">Channel IDs</Label>
                    <EditInput value={adminConsole} label="adminConsole" onChange={setAdminConsole} />
                    <EditInput value={adminLogs} label="adminLogs" onChange={setAdminLogs} />
                    
                </div>

                <div>
                    <Label className="text-black text-xl font-bold mb-5">Mentor Tickets</Label>
                    <EditInput value={incomingTicketsChannel} label="incomingTicketsChannel" onChange={setIncomingTicketsChannel} />
                    <EditInput value={mentorRoleSelection} label="mentorRoleSelection" onChange={setMentorRoleSelection} />
                    <EditInput value={requestTicketChannel} label="requestTicketChannel" onChange={setRequestTicketChannel} />
                </div>

                <div>
                    <Label className="text-black text-xl font-bold mb-5">Roles</Label>
                    <EditInput value={adminRole} label="adminRole" onChange={setAdminRole} />
                    <EditInput value={everyoneRole} label="everyoneRole" onChange={setEveryoneRole} />
                    <EditInput value={memberRole} label="memberRole" onChange={setMemberRole} />
                    <EditInput value={mentorRole} label="mentorRole" onChange={setMentorRole} />
                    <EditInput value={staffRole} label="staffRole" onChange={setStaffRole} />
                </div>

                <div>
                    <Label className="text-black text-xl font-bold mb-5">Verification</Label>
                    <EditInput value={guestRoleID} label="guestRoleID" onChange={setGuestRoleID} />
                    <EditInput value={isEnabled} label="isEnabled" onChange={setIsEnabled} />
                    <EditInput value={welcomeSupportChannel} label="welcomeSupportChannel" onChange={setWelcomeSupportChannel} />
                    <EditInput value={hackerRoleID} label="hackerRoleID" onChange={setHackerRoleID} />
                    <EditInput value={sponsorRoleID} label="sponsorRoleID" onChange={setSponsorRoleID} />
                    <EditInput value={organizerRoleID} label="organizerRoleID" onChange={setOrganizerRoleID} />
                    <EditInput value={photographerRoleID} label="photographerRoleID" onChange={setPhotographerRoleID} />
                    <EditInput value={volunteerRoleID} label="volunteerRoleID" onChange={setVolunteerRoleID} />
                    
                </div>
           

            </div>
        </div>
    )
}