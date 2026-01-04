import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { subscribeToHackathons } from "@/lib/firebase/firestore";
import type { FilterRowsSelection, Hackathon, Stamp } from "@/lib/firebase/types";
import { getHackathonType } from "@/lib/utils";
import { deleteStampWithImage, upsertStampWithImage } from "@/services/stamps";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CriteriaBuilder } from "./criteria-builder";

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const EMPTY_FORM = {
  name: "",
  description: "",
  hackathon: "",
  isHidden: false,
  isQRUnlockable: false,
};

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().min(2, "Description must be at least 2 characters").max(500),
  hackathon: z.string().optional(),
  isHidden: z.boolean(),
  isQRUnlockable: z.boolean(),
});

const imageSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, "Max image size is 5MB.")
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Only .jpg, .jpeg, .png formats are supported.",
  );

interface StampDialogProps {
  open: boolean;
  activeStamp?: Stamp | null;
  onClose: () => void;
}

const PORTAL_BASE_URL = "https://portal.nwplus.io";

/**
 * Generate a QR code as a Blob
 * URL format: https://portal.nwplus.io/{hackathon}/stampbook?unlockStamp={stampId}
 * TODO: will be https://portal.nwplus.io/stampbook?unlockStamp={stampId} for global stamps now; portal currently does not support this
 */
async function generateQRBlob(stampId: string, hackathonId?: string): Promise<Blob> {
  const hackathonSlug = hackathonId ? getHackathonType(hackathonId) : undefined;
  const path = hackathonSlug ? `/${hackathonSlug}/stampbook` : "/stampbook";
  const qrContent = `${PORTAL_BASE_URL}${path}?unlockStamp=${stampId}`;
  
  const dataUrl = await QRCode.toDataURL(qrContent, {
    width: 512,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  const response = await fetch(dataUrl);
  return await response.blob();
}

export function StampDialog({ open, activeStamp, onClose }: StampDialogProps) {
  const mode: "edit" | "new" = activeStamp ? "edit" : "new";
  const [loading, setLoading] = useState<boolean>(false);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [criteria, setCriteria] = useState<FilterRowsSelection[]>([]);

  useEffect(() => {
    const unsubHackathons = subscribeToHackathons((hackathons: Hackathon[]) => {
      setHackathons(hackathons);
    });
    return () => unsubHackathons();
  }, []);

  useEffect(() => {
    if (activeStamp?.imgURL) {
      setImagePreview(activeStamp.imgURL);
    }
    if (activeStamp?.criteria) {
      setCriteria(activeStamp.criteria);
    }
  }, [activeStamp]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      name: activeStamp?.name ?? "",
      description: activeStamp?.description ?? "",
      hackathon: activeStamp?.hackathon ?? "",
      isHidden: activeStamp?.isHidden ?? false,
      isQRUnlockable: activeStamp?.isQRUnlockable ?? false,
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
    setImagePreview(null);
    setImageError(null);
  };

  const close = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    setCriteria([]);
    form.reset(EMPTY_FORM);
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
      const stampData: Stamp = {
        name: values.name,
        description: values.description,
        isHidden: values.isHidden,
        isQRUnlockable: values.isQRUnlockable,
        imgName: imageFile?.name || activeStamp?.imgName || "",
      };

      if (values.hackathon) {
        stampData.hackathon = values.hackathon;
      }
      if (criteria.length > 0) {
        stampData.criteria = criteria;
      }

      // Generate QR blob if isQRUnlockable is true and this is a new stamp
      // or if it's being enabled for the first time
      let qrBlob: Blob | null = null;
      const stampId = activeStamp?._id;
      const needsNewQR = values.isQRUnlockable && (!activeStamp || !activeStamp.isQRUnlockable);
      const hackathonForQR = values.hackathon || undefined;
      
      if (needsNewQR && stampId) {
        qrBlob = await generateQRBlob(stampId, hackathonForQR);
      }

      const upsertedStamp = await upsertStampWithImage(
        stampData,
        imageFile,
        qrBlob,
        activeStamp?._id,
      );

      if (!upsertedStamp) throw new Error("Error upserting stamp");

      if (values.isQRUnlockable && !activeStamp?._id) {
        const newStampId = upsertedStamp.id;
        const newQrBlob = await generateQRBlob(newStampId, hackathonForQR);
        await upsertStampWithImage(
          { ...stampData, isQRUnlockable: true },
          null,
          newQrBlob,
          newStampId,
        );
      }

      form.reset(EMPTY_FORM);
      toast(`Stamp successfully ${activeStamp?._id ? "edited" : "created"}`);
      close();
    } catch (error) {
      console.error("Error upserting stamp", error);
      toast(`Something went wrong ${activeStamp?._id ? "editing" : "creating"} this stamp`);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!activeStamp?._id) return;
    if (loading) return;
    setLoading(true);

    try {
      await deleteStampWithImage(activeStamp._id);
      form.reset(EMPTY_FORM);
      toast("Stamp successfully deleted.");
      close();
    } catch (error) {
      console.error("Error deleting stamp", error);
      toast("Something went wrong deleting this stamp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) close();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Stamp" : "New Stamp"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ImageUpload
              label="Stamp Image"
              imagePreview={imagePreview}
              imageError={imageError}
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
              altText="Stamp image preview"
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter stamp name..." {...field} />
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
                    <Textarea placeholder="Enter stamp description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hackathon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hackathon</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "__global__" ? "" : value)}
                    value={field.value || "__global__"}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Global" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__global__">Global</SelectItem>
                      {[...new Map(hackathons.map((h) => [h._id, h])).values()].map((h) => (
                        <SelectItem key={h._id} value={h._id}>
                          {h._id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CriteriaBuilder criteria={criteria} onChange={setCriteria} />

            <FormField
              control={form.control}
              name="isHidden"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Hidden Stamp</FormLabel>
                    <FormDescription>
                      If enabled, this stamp won't be visible until unlocked (secret stamp).
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isQRUnlockable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>QR Unlockable</FormLabel>
                    <FormDescription>
                      If enabled, a QR code will be generated that hackers can scan to unlock this
                      stamp.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {activeStamp?.qrURL && (
              <div className="space-y-2 rounded-lg border p-3">
                <p className="font-medium text-sm">Generated QR Code</p>
                <div className="flex items-end gap-3">
                  <img
                    src={activeStamp.qrURL}
                    alt="Stamp QR Code"
                    className="h-32 w-32 rounded-md border bg-white p-2"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = activeStamp.qrURL!;
                      link.download = `stamp-qr-${activeStamp.name?.replace(/\s+/g, "-").toLowerCase() || activeStamp._id}.png`;
                      link.click();
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download QR
                  </Button>
                </div>
                <p className="text-neutral-500 text-xs">
                  Hackers can scan this QR to unlock the stamp.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button disabled={loading} type="submit">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "edit" ? "Save changes" : "Create stamp"}
                </Button>
                {mode === "edit" && !loading && (
                  <Confirm variant="destructive" onConfirm={onDelete}>
                    Delete
                  </Confirm>
                )}
              </div>
              {mode === "edit" && activeStamp?.lastModified && (
                <div className="text-neutral-500 text-sm">
                  Last edited at {activeStamp.lastModified.toDate().toLocaleString()} by{" "}
                  {activeStamp.lastModifiedBy}
                </div>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

