import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { QuestionTable } from "./question-table";
import { useState } from "react";
import { upsertDiscordQuestion } from "@/services/discord-questions";
import type { DiscordQuestion } from "@/lib/firebase/types";
import { useFactotum } from "@/providers/factotum-provider";
import { toast } from "sonner";

export default function AddDiscordQuestions() {

    const [sponsor, setSponsor] = useState<string>("");
    const [question, setQuestion] = useState<string>("");
    const [answer, setAnswer] = useState<string>("");
    const [needAllAnswers, setNeedAllAnswers] = useState<boolean>(false);

    const server = useFactotum().server

    const handleClear = () => {
        setSponsor("")
        setQuestion("")
        setAnswer("")
        setNeedAllAnswers(false)
    }

    const handleSubmit = async () => {
        const formattedAnswer = answer.split(",").map((c) => c.trim())
        const data : DiscordQuestion = {
            answer: formattedAnswer, 
            question: question,
            sponsor: sponsor,
            needAllAnswers: needAllAnswers
        }
        upsertDiscordQuestion(data, server)
        handleClear()
        toast("Question successfully added.")
    }

    return (
        <div>
            <h1 className="font-bold text-2xl line-height-10 mb-5">Add Discord Questions</h1>

            <div className="flex gap-7">
                <div>
                    <Label className="text-black text-lg font-bold">Sponsor</Label>
                    <p className="text-black text-sm mb-2">Use official sponsor name</p>
                    <Input className="text-black border-2 border-gray-300 focus-visible:border-gray-300" 
                     onChange={(e) => setSponsor(e.target.value)}
                     value = {sponsor} />
                </div>

                <div className="w-[40%]">
                    <Label className="text-black text-lg font-bold">Question</Label>
                    <p className="text-black text-sm mb-2">What is the question?</p>
                    <Input className="text-black border-2 border-gray-300 focus-visible:border-gray-300" 
                    onChange={(e) => setQuestion(e.target.value)}
                    value = {question} />
                </div>
                <div className="w-[40%]">
                    <Label className="text-black text-lg font-bold">Answer</Label>
                    <p className="text-black text-sm mb-2">Separate multiple answers with a comma</p>
                    <Input className="text-black border-2 border-gray-300 focus-visible:border-gray-300" 
                    onChange={(e) => setAnswer(e.target.value)}
                    value = {answer} />
                </div>
            </div>

            <div className="flex gap-2 mt-5 items-center">
                <Checkbox className="border-black" checked={needAllAnswers} onCheckedChange={setNeedAllAnswers} />
                <p className="text-black text-sm ">Require all answers to be correct?</p>
            </div>

            <div className="flex gap-5 my-5 items-center">
                <Button  onClick={handleSubmit}>Submit</Button>
                <Button  variant="outline" onClick={handleClear}>Clear</Button>
            </div>

            <h1 className="font-bold text-2xl line-height-10 mb-5">List of Discord Questions</h1>

            
            <QuestionTable />

            

        </div>
    )
}