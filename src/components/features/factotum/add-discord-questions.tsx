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

  const server = useFactotum().server;

  const handleClear = () => {
    setSponsor("");
    setQuestion("");
    setAnswer("");
    setNeedAllAnswers(false);
  };

  const handleSubmit = async () => {
    const formattedAnswer = answer.split(",").map((c) => c.trim());
    const data: DiscordQuestion = {
      answer: formattedAnswer,
      question: question,
      sponsor: sponsor,
      needAllAnswers: needAllAnswers,
    };
    upsertDiscordQuestion(data, server);
    handleClear();
    toast("Question successfully added.");
  };

  return (
    <div>
      <h1 className="line-height-10 mb-5 font-bold text-2xl">Add Discord Questions</h1>

      <div className="flex gap-7">
        <div>
          <Label className="font-bold text-black text-lg">Sponsor</Label>
          <p className="mb-2 text-black text-sm">Use official sponsor name</p>
          <Input
            className="border-2 border-gray-300 text-black focus-visible:border-gray-300"
            onChange={(e) => setSponsor(e.target.value)}
            value={sponsor}
          />
        </div>

        <div className="w-[40%]">
          <Label className="font-bold text-black text-lg">Question</Label>
          <p className="mb-2 text-black text-sm">What is the question?</p>
          <Input
            className="border-2 border-gray-300 text-black focus-visible:border-gray-300"
            onChange={(e) => setQuestion(e.target.value)}
            value={question}
          />
        </div>
        <div className="w-[40%]">
          <Label className="font-bold text-black text-lg">Answer</Label>
          <p className="mb-2 text-black text-sm">Separate multiple answers with a comma</p>
          <Input
            className="border-2 border-gray-300 text-black focus-visible:border-gray-300"
            onChange={(e) => setAnswer(e.target.value)}
            value={answer}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Checkbox
          className="border-black"
          checked={needAllAnswers}
          onCheckedChange={setNeedAllAnswers}
        />
        <p className="text-black text-sm ">Require all answers to be correct?</p>
      </div>

      <div className="my-5 flex items-center gap-5">
        <Button onClick={handleSubmit}>Submit</Button>
        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>
      </div>

      <h1 className="line-height-10 mb-5 font-bold text-2xl">List of Discord Questions</h1>

      <QuestionTable />
    </div>
  );
}
