import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import type { DiscordQuestion } from "@/lib/firebase/types";
import { Confirm } from "@/components/ui/confirm";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { deleteDiscordQuestion, upsertDiscordQuestion } from "@/services/discord-questions";
import { useFactotum } from "@/providers/factotum-provider";
import { Textarea } from "@/components/ui/textarea";
const formSchema = z.object({
  question: z.string().min(2).max(500),
  answer: z.string().min(2).max(5000),
  sponsor: z.string(),
  needAllAnswers: z.boolean(),
});
interface DiscordQuestionDialogProps {
  open: boolean;
  onClose: () => void;
  activeQuestion?: DiscordQuestion | null;
}

export function DiscordQuestionDialog({
  open,
  onClose,
  activeQuestion,
}: DiscordQuestionDialogProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const server = useFactotum().server;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      question: activeQuestion?.question ?? "",
      answer: activeQuestion?.answer?.join(", ") ?? "",
      sponsor: activeQuestion?.sponsor ?? "",
      needAllAnswers: activeQuestion?.needAllAnswers ?? false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);
    const answerArray = values.answer
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);
    await upsertDiscordQuestion(
      {
        ...values,
        answer: answerArray,
      } as unknown as DiscordQuestion,
      server,
      activeQuestion?.id,
    );
    form.reset({
      question: "",
      answer: "",
      sponsor: "",
      needAllAnswers: false,
    });
    toast("Question successfully edited");
    setLoading(false);
    onClose();
  };

  const onDelete = async () => {
    if (!activeQuestion) return;
    if (loading) return;
    setLoading(true);
    await deleteDiscordQuestion(server, activeQuestion?.id);
    form.reset({
      question: "",
      answer: "",
      sponsor: "",
      needAllAnswers: false,
    });
    toast("Discord question successfully deleted.");
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent aria-describedby={undefined} className="w-1/2">
        <DialogHeader>
          <DialogTitle>Edit Discord Question</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Type here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Type here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sponsor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sponsor</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Type here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="needAllAnswers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Need All Answers?</FormLabel>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button disabled={loading} type="submit">
                  Save Changes
                </Button>

                <Confirm variant="destructive" onConfirm={onDelete}>
                  Delete
                </Confirm>
              </div>

              <div className="text-neutral-500 text-sm">
                Last edited at {activeQuestion?.lastModified?.toDate()?.toLocaleString()} by{" "}
                {activeQuestion?.lastModifiedBy}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
