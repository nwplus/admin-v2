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
import { ImageUpload } from "@/components/ui/image-upload";
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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const EMPTY_FORM = {
  reward: "",
  blurb: "",
  type: "" as "Reward" | "Raffle",
  prizesAvailable: "",
  requiredPoints: "",
};

const formSchema = z.object({
  reward: z.string().min(2).max(100),
  blurb: z.string().min(2).max(500),
  type: z.enum(["Reward", "Raffle"]),
  prizesAvailable: z.string().max(10),
  requiredPoints: z.string().max(10),
});

const imageSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, "Max image size is 5MB.")
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Only .jpg, .jpeg, .png formats are supported.",
  );

interface RewardDialogProps {
  open: boolean;
  activeReward?: HackathonRewards | null;
  onClose: () => void;
}

export function RewardDialog({ open, onClose, activeReward }: RewardDialogProps) {
  const { activeHackathon } = useHackathon();
  const mode: "edit" | "new" = activeReward ? "edit" : "new";
  const [loading, setLoading] = useState<boolean>(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (activeReward?.imgURL) {
      setImagePreview(activeReward?.imgURL);
    }
  }, [activeReward]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      reward: activeReward?.reward ?? "",
      blurb: activeReward?.blurb ?? "",
      type: activeReward?.type ?? ("" as "Reward" | "Raffle"),
      prizesAvailable: activeReward?.prizesAvailable ?? "",
      requiredPoints: activeReward?.requiredPoints ?? "",
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = imageSchema.safeParse(file);
    if (!validation.success) {
      setImageError(validation.error.errors[0].message);
      return;
    }

    setImageError(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(activeReward?.imgURL ?? null);
    setImageError(null);
  };

  const close = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    onClose();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (loading) return;

    if (mode === "new" && !imageFile) {
      setImageError("Please select an image");
      return;
    }

    setLoading(true);
    try {
      const rewardData: HackathonRewards = {
        ...values,
        imgName: imageFile?.name || activeReward?.imgName || "",
      } as HackathonRewards;

      const upsertedReward = await upsertReward(activeHackathon, rewardData, imageFile, activeReward?.key);
      if (!upsertedReward) throw new Error("Error upserting a reward");

      form.reset(EMPTY_FORM);
      toast(`Reward successfully ${activeReward?.key ? "edited" : "created"}`);
      close();
    } catch (error) {
      console.error("Error upserting a reward", error);
      toast(
        `Something went wrong ${activeReward?.key ? "editing" : "creating"} this reward`,
      );
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!activeReward) return;
    if (loading) return;
    setLoading(true);
    await deleteReward(activeHackathon, activeReward.key as string);
    form.reset(EMPTY_FORM);
    toast("Reward successfully deleted.");
    setLoading(false);
    close();
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(state) => {
        if (!state) close();
      }}
    >
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
            <ImageUpload
              label="Image"
              imagePreview={imagePreview}
              imageError={imageError}
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              altText="Reward image preview"
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
