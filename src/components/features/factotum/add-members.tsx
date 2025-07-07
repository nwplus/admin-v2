import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { Textarea } from "@/components/ui/textarea";
import { useFactotum } from "@/providers/factotum-provider";
import { addParticipants } from "@/services/factotum";
import { useState } from "react";
import { toast } from "sonner";

export default function AddMembers() {
  const [emails, setEmails] = useState<string>("");
  const server = useFactotum().server;
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["Mentor"]);

  const availableRoles = [
    {
      label: "Mentor",
      value: "Mentor",
    },
    {
      label: "Sponsor",
      value: "Sponsor",
    },
    {
      label: "Volunteer",
      value: "Volunteer",
    },
    {
      label: "Photographer",
      value: "Photographer",
    },
    {
      label: "Organizer",
      value: "Organizer",
    },
  ];

  const handleSubmit = async () => {
    const emailList = emails
      .split("\n")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
    try {
      await addParticipants(emailList, selectedRoles, server);
      toast("Participants added successfully");
    } catch (err) {
      toast.error("Failed to add participants");
      console.error(err);
    }
  };

  return (
    <div>
      <h1 className="line-height-10 mb-5 font-bold text-2xl">Add Discord Members</h1>

      <Label className="mb-2 font-bold text-black text-md">I am adding...</Label>
      <MultiSelect
        compressed
        selectAll
        options={availableRoles}
        selected={selectedRoles}
        onChange={setSelectedRoles}
        placeholder="Select roles..."
        className="max-h-9 w-52"
      />

      <Label className="mt-5 mb-2 font-bold text-black text-md ">
        Enter Emails (separated by new line)
      </Label>
      <Textarea
        value={emails}
        onChange={(e) => setEmails(e.target.value)}
        className="h-80 w-1/2 border-2 border-gray-300 text-black focus-visible:border-gray-300"
      />

      <div className="flex gap-5">
        <Button className="mt-5" onClick={handleSubmit}>
          Add Members
        </Button>
        <Button className="mt-5" onClick={() => setEmails("")} variant="outline">
          Clear
        </Button>
      </div>
    </div>
  );
}
