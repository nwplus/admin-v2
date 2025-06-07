import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { HackathonDayOf } from "@/lib/firebase/types";
import { isValidISODateString } from "@/lib/utils";
import { useHackathon } from "@/providers/hackathon-provider";
import { deleteEvent, upsertEvent } from "@/services/schedule";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const EMPTY_FORM = {
  name: undefined,
  description: undefined,
  location: undefined,
  type: undefined,
  points: undefined,
  startTime: undefined as Date | undefined,
  endTime: undefined as Date | undefined,
  isDelayed: undefined,
};

const formSchema = z
  .object({
    name: z.string().min(2).max(100),
    description: z.string().min(2).max(250),
    location: z.string().min(2).max(100),
    type: z.string().min(1, "Please select an event type"),
    points: z.string(),
    startTime: z
      .date({
        invalid_type_error: "Please select a valid start date",
      })
      .optional(),
    endTime: z
      .date({
        invalid_type_error: "Please select a valid end date",
      })
      .optional(),
    isDelayed: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start time is required",
        path: ["startTime"],
      });
    }
    if (!data.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time is required",
        path: ["endTime"],
      });
    }
    if (data.startTime && data.endTime && data.endTime <= data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time",
        path: ["endTime"],
      });
    }
  });

interface EventDialogProps {
  open: boolean;
  activeEvent?: HackathonDayOf | null;
  onClose: () => void;
}

export function EventDialog({ open, onClose, activeEvent }: EventDialogProps) {
  const { activeHackathon } = useHackathon();

  const mode: "edit" | "new" = activeEvent ? "edit" : "new";
  const [loading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      name: activeEvent?.name ?? "",
      description: activeEvent?.description ?? "",
      location: activeEvent?.location ?? "",
      type: activeEvent?.type ?? "",
      points: activeEvent?.points ?? "",
      startTime: isValidISODateString(activeEvent?.startTime)
        ? new Date(activeEvent.startTime)
        : undefined,
      endTime: isValidISODateString(activeEvent?.endTime)
        ? new Date(activeEvent.endTime)
        : undefined,
      isDelayed: activeEvent?.isDelayed ?? false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);
    const parsedEvent = {
      ...values,
      startTime: values.startTime?.toISOString(),
      endTime: values.endTime?.toISOString(),
    };
    await upsertEvent(activeHackathon, parsedEvent as unknown as HackathonDayOf, activeEvent?._id);
    form.reset(EMPTY_FORM);
    toast(`Event successfully ${activeEvent?._id ? "edited" : "created"}`);
    setLoading(false);
    onClose();
  };

  const onDelete = async () => {
    if (!activeEvent?._id) return;
    if (loading) return;
    setLoading(true);
    await deleteEvent(activeHackathon, activeEvent._id);
    form.reset(EMPTY_FORM);
    toast("Event successfully deleted.");
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Event</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start time</FormLabel>
                  <FormControl>
                    <DatePicker {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End time</FormLabel>
                  <FormControl>
                    <DatePicker {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Type here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Type here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Type here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="main">Main</SelectItem>
                      <SelectItem value="workshops">Workshop</SelectItem>
                      <SelectItem value="minievents">Mini-event</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points</FormLabel>
                  <FormControl>
                    <Input placeholder="Type here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isDelayed"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-0.5">
                    <FormLabel>Is Delayed</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button disabled={loading} type="submit">
                  {mode === "edit" ? "Save changes" : "Create event"}
                </Button>
                {mode === "edit" && (
                  <Confirm variant="destructive" onConfirm={onDelete}>
                    Delete
                  </Confirm>
                )}
              </div>
              {mode === "edit" && (
                <div className="text-neutral-500 text-sm">
                  Last edited at {activeEvent?.lastModified?.toDate()?.toLocaleString()} by{" "}
                  {activeEvent?.lastModifiedBy}
                </div>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
