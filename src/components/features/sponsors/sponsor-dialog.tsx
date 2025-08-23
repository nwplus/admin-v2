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
import type { HackathonSponsorTiers, HackathonSponsors } from "@/lib/firebase/types";
import { useHackathon } from "@/providers/hackathon-provider";
import {
  deleteHackathonSponsorWithImage,
  upsertHackathonSponsorWithImage,
} from "@/services/sponsors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const EMPTY_FORM = {
  name: "",
  blurb: "",
  link: "",
  tier: "",
};
const SPONSOR_TIERS: { value: HackathonSponsorTiers; label: string }[] = [
  { value: "inkind", label: "In-kind" },
  { value: "bronze", label: "Bronze" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "platinum", label: "Platinum" },
  { value: "title", label: "Title" },
  { value: "startup", label: "Startup" },
];

const formSchema = z.object({
  name: z.string().min(2).max(250),
  blurb: z.string().min(2).max(500),
  link: z.string().url("Please enter a valid URL"),
  tier: z.string().min(1, "Please select a tier"),
});

const imageSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, "Max image size is 5MB.")
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Only .jpg, .jpeg, .png formats are supported.",
  );

interface SponsorDialogProps {
  open: boolean;
  activeSponsor?: HackathonSponsors | null;
  onClose: () => void;
}

export function SponsorDialog({ open, activeSponsor, onClose }: SponsorDialogProps) {
  const { activeHackathon } = useHackathon();
  const mode: "edit" | "new" = activeSponsor ? "edit" : "new";
  const [loading, setLoading] = useState<boolean>(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (activeSponsor?.imgURL) {
      setImagePreview(activeSponsor?.imgURL);
    }
  }, [activeSponsor]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      name: activeSponsor?.name ?? "",
      blurb: activeSponsor?.blurb ?? "",
      link: activeSponsor?.link ?? "",
      tier: activeSponsor?.tier ?? "",
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
    setImagePreview(activeSponsor?.imgURL ?? null);
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
      const sponsorData: HackathonSponsors = {
        ...(values as Partial<HackathonSponsors>),
        imgName: imageFile?.name || activeSponsor?.imgName || "",
      };

      const upsertedSponsor = await upsertHackathonSponsorWithImage(
        activeHackathon,
        sponsorData,
        imageFile,
        activeSponsor?._id,
      );
      if (!upsertedSponsor) throw new Error("Error upserting a sponsor");

      form.reset(EMPTY_FORM);
      toast(`Sponsor successfully ${activeSponsor?._id ? "edited" : "created"}`);
      close();
    } catch (error) {
      console.error("Error upserting a sponsor", error);
      toast(
        `Something went wrong updating ${activeSponsor?._id ? "editing" : "creating"} this sponsor`,
      );
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!activeSponsor?._id) return;
    if (loading) return;
    setLoading(true);

    await deleteHackathonSponsorWithImage(activeHackathon, activeSponsor._id);
    form.reset(EMPTY_FORM);
    toast("Sponsor successfully deleted.");
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
          <DialogTitle>Sponsor</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ImageUpload
              label="Logo"
              imagePreview={imagePreview}
              imageError={imageError}
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              altText="Sponsor logo preview"
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
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <Input placeholder="Type here..." {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tier</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SPONSOR_TIERS?.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button disabled={loading} type="submit">
                  {mode === "edit" ? "Save changes" : "Add sponsor"}
                </Button>
                {mode === "edit" && (
                  <Confirm variant="destructive" onConfirm={onDelete}>
                    Delete
                  </Confirm>
                )}
              </div>
              {mode === "edit" && (
                <div className="text-neutral-500 text-sm">
                  Last edited at {activeSponsor?.lastmod?.toDate()?.toLocaleString()} by{" "}
                  {activeSponsor?.lastmodBy}
                </div>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
