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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { HackathonRewards } from "@/lib/firebase/types";
import { useHackathon } from "@/providers/hackathon-provider";
import { deleteReward, upsertReward } from "@/services/rewards";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const EMPTY_FORM = {
  reward: "",
  blurb: "",
  imgName: "",
  imgURL: "",
  type: "",
  prizesAvailable: "",
  requiredPoints: "",
};

const formSchema = z.object({
  reward: z.string().min(2).max(100),
  blurb: z.string().min(2).max(500),
  imgName: z.string().min(2).max(100),
  imgURL: z.string().min(2).max(100),
  type: z.string().min(5).max(7),
  prizesAvailable: z.string().max(10),
  requiredPoints: z.string().max(10),
});

interface RewardDialogProps {
  open: boolean;
  activeReward?: HackathonRewards | null;
  onClose: () => void;
}

export function RewardDialog({ open, onClose, activeReward }: RewardDialogProps) {
  const { activeHackathon } = useHackathon();
  const mode: "edit" | "new" = activeReward ? "edit" : "new";
  const [loading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      reward: activeReward?.reward ?? "",
      blurb: activeReward?.blurb ?? "",
      imgName: activeReward?.imgName ?? "",
      imgURL: activeReward?.imgURL ?? "",
      type: activeReward?.type ?? "",
      prizesAvailable: activeReward?.prizesAvailable ?? "",
      requiredPoints: activeReward?.requiredPoints ?? "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);
    await upsertReward(activeHackathon, values as unknown as HackathonRewards, activeReward?.key);
    form.reset(EMPTY_FORM);
    toast(`Reward successfully ${activeReward?.key ? "edited" : "created"}`);
    setLoading(false);
    onClose();
  };

  const onDelete = async () => {
    if (!activeReward) return;
    if (loading) return;
    setLoading(true);
    await deleteReward(activeHackathon, activeReward.key as string);
    form.reset(EMPTY_FORM);
    toast("Reward successfully deleted.");
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Rewards</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reward"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Type here..." {...field} />
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
                      <SelectItem value="Reward">Reward</SelectItem>
                      <SelectItem value="Raffle">Raffle</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="blurb"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blurb</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Type here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imgName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image name</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Type here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imgURL"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Type here..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="prizesAvailable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available prizes</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Type here..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requiredPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required points</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Type here..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button disabled={loading} type="submit">
                  {mode === "edit" ? "Save changes" : "Create reward"}
                </Button>
                {mode === "edit" && (
                  <Confirm variant="destructive" onConfirm={onDelete}>
                    Delete
                  </Confirm>
                )}
              </div>
              {mode === "edit" && (
                <div className="text-neutral-500 text-sm">
                  Last edited at {activeReward?.lastmod?.toDate()?.toLocaleString()} by{" "}
                  {activeReward?.lastmodBy}
                </div>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
