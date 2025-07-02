import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { addParticipants } from "@/services/dev-config";
import { useFactotum } from "@/providers/factotum-provider";
import { toast } from "sonner";
import { MultiSelect } from "@/components/ui/multi-select";

export default function AddMembers() {

  const [emails, setEmails] = useState<string>("");
  const server = useFactotum().server
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["Mentor"]);

  const availableRoles = [
    {
    label: "Mentor",
    value: "Mentor"
  },
  {
    label: "Sponsor",
    value: "Sponsor"
  },
  {
    label: "Volunteer",
    value: "Volunteer"
  },
  {
    label: "Photographer",
    value: "Photographer"
  },
  {
    label: "Organizer",
    value: "Organizer"
  },
]

  const handleSubmit = async() => {
    const emailList = emails.split("\n").map((e) => e.trim()).filter((e) => e.length > 0)
    try {
      await addParticipants(emailList, selectedRoles, server)
      toast("Participants added successfully")
    } 
    catch (err) {throw err}

  }

    return (
        <div>
            <h1 className="font-bold text-2xl line-height-10 mb-5">Add Discord Members</h1>

            <Label className="text-black text-md mb-2 font-bold">I am adding...</Label>
            <MultiSelect 
              compressed
              selectAll
              options={availableRoles}
              selected={selectedRoles}
              onChange={setSelectedRoles}
              placeholder="Select roles..."
              className="max-h-9 w-52"
            />

            <Label className="text-black text-md mb-2 mt-5 font-bold ">Enter Emails (separated by new line)</Label>
            <Textarea value = {emails} onChange={(e) => setEmails(e.target.value)} className="text-black w-1/2 h-80 focus-visible:border-gray-300 border-2 border-gray-300" />

            <div className="flex gap-5">
                <Button className="mt-5" onClick={handleSubmit}>Add Members</Button>
                <Button className="mt-5" onClick={() => setEmails("")} variant="outline">Clear</Button>
            </div>
            
        </div>
    )
}