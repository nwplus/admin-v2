import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FAQ, Hackathon } from "@/lib/firebase/types";
import { deleteFAQ, upsertFAQ } from "@/services/faq";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  question: z.string().min(2).max(10000),
  answer: z.string().min(2).max(100000),
  category: z.string(),
  hackathonIDs: z.array(z.string()),
});

interface FAQDialogProps {
  open: boolean;
  activeFaq?: FAQ | null;
  hackathons?: Hackathon[];
  onClose: () => void;
}

export function FAQDialog({ open, onClose, activeFaq, hackathons }: FAQDialogProps) {
  const mode: "edit" | "new" = activeFaq ? "edit" : "new";
  const [loading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      question: activeFaq?.question ?? "",
      answer: activeFaq?.answer ?? "",
      category: activeFaq?.category ?? "",
      hackathonIDs: activeFaq?.hackathonIDs ?? [],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);
    await upsertFAQ(values as unknown as FAQ, activeFaq?._id);
    form.reset({
      question: "",
      answer: "",
      category: "",
      hackathonIDs: [],
    });
    toast(`FAQ successfully ${activeFaq?._id ? "edited" : "created"}`);
    setLoading(false);
    onClose();
  };

  const onDelete = async () => {
    if (!activeFaq) return;
    if (loading) return;
    setLoading(true);
    await deleteFAQ(activeFaq._id);
    form.reset({
      question: "",
      answer: "",
      category: "",
      hackathonIDs: [],
    });
    toast("FAQ successfully deleted.");
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>FAQ</DialogTitle>
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Logistics">Logistics</SelectItem>
                      <SelectItem value="Teams & Projects">Teams & Projects</SelectItem>
                      <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hackathonIDs"
              render={({ field }) => {
                const hackathonOptions: MultiSelectOption[] =
                  hackathons?.map((hackathon) => ({
                    label: hackathon._id,
                    value: hackathon._id,
                  })) || [];

                return (
                  <FormItem>
                    <FormLabel>Hackathons</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={hackathonOptions}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Select hackathons..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button disabled={loading} type="submit">
                  {mode === "edit" ? "Save changes" : "Create FAQ"}
                </Button>
                {mode === "edit" && (
                  <Confirm variant="destructive" onConfirm={onDelete}>
                    Delete
                  </Confirm>
                )}
              </div>
              {mode === "edit" && (
                <div className="text-neutral-500 text-sm">
                  Last edited at {activeFaq?.lastModified?.toDate()?.toLocaleString()} by{" "}
                  {activeFaq?.lastModifiedBy}
                </div>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
