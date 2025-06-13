import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { TableDemo } from "./lorem-table";




export default function AddDiscordQuestions() {
    return (
        <div>
            <h1 className="font-bold text-2xl line-height-10 mb-5">Add Discord Questions</h1>

            <div className="flex gap-7">
                <div>
                    <Label className="text-black text-lg font-bold">Sponsor</Label>
                    <p className="text-black text-sm mb-2">Use official sponsor name</p>
                    <Input className="text-black border-2 border-gray-300 focus-visible:border-gray-300" />
                </div>

                <div className="w-[40%]">
                    <Label className="text-black text-lg font-bold">Question</Label>
                    <p className="text-black text-sm mb-2">What is the question?</p>
                    <Input className="text-black border-2 border-gray-300 focus-visible:border-gray-300" />
                </div>
                <div className="w-[40%]">
                    <Label className="text-black text-lg font-bold">Answer</Label>
                    <p className="text-black text-sm mb-2">Separate multiple answers with a comma</p>
                    <Input className="text-black border-2 border-gray-300 focus-visible:border-gray-300" />
                </div>
            </div>

            <div className="flex gap-2 mt-5 items-center">
                <Checkbox className="border-black" />
                <p className="text-black text-sm ">Require all answers to be correct?</p>
            </div>

            <div className="flex gap-5 mb-10">
                <Button className="mt-5">Submit</Button>
                <Button className="mt-5" variant="outline">Clear</Button>
            </div>

            <h1 className="font-bold text-2xl line-height-10 mb-5">List of Discord Questions</h1>

            
            <TableDemo />

            

        </div>
    )
}