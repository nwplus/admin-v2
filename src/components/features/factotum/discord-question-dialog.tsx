import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import type { DiscordQuestion } from "@/lib/firebase/types";
import { db } from "@/lib/firebase/client";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";

interface DiscordQuestionDialogProps {
  question: DiscordQuestion;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiscordQuestionDialog({
  question,
  isOpen,
  onOpenChange,
}: DiscordQuestionDialogProps) {
  const [sponsor, setSponsor] = useState(question.sponsor);
  const [questionText, setQuestionText] = useState(question.question);
  const [answer, setAnswer] = useState(question.answer);
  const [required, setRequired] = useState(question.required);

  const handleSave = () => {
    // const questionRef = doc(db, "questions", question.id);
    // updateDoc(questionRef, {
    //   sponsor: sponsor,
    //   question: questionText,
    //   answer: answer,

    // })
    toast.success("Question updated successfully");
    onOpenChange(false);
  }



  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-1/2">
        <DialogHeader>
          <DialogTitle>Edit Discord Question</DialogTitle>
          <DialogDescription>
            Last updated: {question.updatedAt.toDate().toLocaleString()} by {question.updatedBy}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sponsor" className="text-right">
              Sponsor
            </Label>
            <Input
              id="sponsor"
              value={sponsor}
              onChange={(e) => setSponsor(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="question" className="text-right">
              Question
            </Label>
            <Input
              id="question"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="answer" className="text-right">
              Answer
            </Label>
            <Input
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="required" className="text-right">
              Required
            </Label>
            <div className="col-span-3">
              <Checkbox
                id="required"
                checked={required}
                onCheckedChange={(checked) => setRequired(checked as boolean)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
        <Button onClick={handleSave}>
            Save changes
          </Button>
          <Button
            variant="destructive"
            
          >
            Delete
          </Button>
          
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 