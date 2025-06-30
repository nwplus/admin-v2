import { SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Select } from "@/components/ui/select";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
export default function AddMembers() {
    //only ui for now, no functionality until factotum rework.
    return (
        <div>
            <h1 className="font-bold text-2xl line-height-10 mb-5">Add Discord Members</h1>

            <Label className="text-black text-md mb-2 font-bold">I am adding...</Label>
            <Select defaultValue="Hacker">
              <SelectTrigger className="w-56 text-black border-2 border-gray-300 focus-visible:border-gray-300">
                <SelectValue className="text-black"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hacker">Hacker</SelectItem>
                <SelectItem value="Mentor">Mentor</SelectItem>
                <SelectItem value="Organizer">Organizer</SelectItem>
              </SelectContent>
            </Select>

            <Label className="text-black text-md mb-2 mt-5 font-bold ">Enter Emails (separated by new line)</Label>
            <Textarea className="text-black w-1/2 h-80 focus-visible:border-gray-300 border-2 border-gray-300" />

            <div className="flex gap-5">
                <Button className="mt-5">Add Members</Button>
                <Button className="mt-5" variant="outline">Clear</Button>
            </div>
            
        </div>
    )
}