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
import { deleteStampQR, deleteStampWithImage, upsertStampWithImage } from "@/services/stamps";
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
  isTitle: false,
  isQRUnlockable: false,
  isEventUnlockable: false,
};

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().min(2, "Description must be at least 2 characters").max(500),
  hackathon: z.string().min(1, "Please select a hackathon"),
  isHidden: z.boolean(),
  isTitle: z.boolean(),
  isQRUnlockable: z.boolean(),
  isEventUnlockable: z.boolean(),
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
 * URL format: https://portal.nwplus.io/{hackathonSlug}/stampbook?unlockStamp={stampId}
 * hackathonSlug is one of: hackcamp, nwhacks, cmd-f
 */
async function generateQRBlob(stampId: string, hackathonId: string): Promise<Blob> {
  const hackathonSlug = getHackathonType(hackathonId);
  const qrContent = `${PORTAL_BASE_URL}/${hackathonSlug}/stampbook?unlockStamp=${stampId}`;
  
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

  const [lockedImageFile, setLockedImageFile] = useState<File | null>(null);
  const [lockedImagePreview, setLockedImagePreview] = useState<string | null>(null);
  const [lockedImageError, setLockedImageError] = useState<string | null>(null);

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
    if (activeStamp?.lockedImgURL) {
      setLockedImagePreview(activeStamp.lockedImgURL);
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
      isTitle: activeStamp?.isTitle ?? false,
      isQRUnlockable: activeStamp?.isQRUnlockable ?? false,
      isEventUnlockable: activeStamp?.isEventUnlockable ?? false,
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

  const handleLockedImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = imageSchema.safeParse(file);
    if (!validation.success) {
      setLockedImageError(validation.error.errors[0].message);
      return;
    }

    setLockedImageError(null);
    setLockedImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setLockedImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLockedImageRemove = () => {
    setLockedImageFile(null);
    setLockedImagePreview(null);
    setLockedImageError(null);
  };

  const close = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);

    setLockedImageFile(null);
    setLockedImagePreview(null);
    setLockedImageError(null);
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
        isTitle: values.isTitle,
        isQRUnlockable: values.isQRUnlockable,
        isEventUnlockable: values.isEventUnlockable,
        imgName: imageFile?.name || activeStamp?.imgName || "",
      };

      stampData.hackathon = values.hackathon;
      if (criteria.length > 0) {
        stampData.criteria = criteria;
      }
      
      // Generate QR blob if isQRUnlockable is being enabled for the first time
      // else delete QR if isQRUnlockable is being disabled and a QR exists
      let qrBlob: Blob | null = null;
      const stampId = activeStamp?._id;
      const needsNewQR = values.isQRUnlockable && (!activeStamp || !activeStamp.isQRUnlockable);
      const needsQRDeletion = !values.isQRUnlockable && activeStamp?.isQRUnlockable && activeStamp?.qrURL;
      
      if (needsNewQR && stampId) {
        qrBlob = await generateQRBlob(stampId, values.hackathon);
      }

      if (needsQRDeletion && stampId) {
        await deleteStampQR(stampId);
      }

      const upsertedStamp = await upsertStampWithImage(
        stampData,
        imageFile,
        lockedImageFile,
        qrBlob,
        activeStamp?._id,
      );

      if (!upsertedStamp) throw new Error("Error upserting stamp");

      if (values.isQRUnlockable && !activeStamp?._id) {
        const newStampId = upsertedStamp.id;
        const newQrBlob = await generateQRBlob(newStampId, values.hackathon);
        await upsertStampWithImage(
          { ...stampData, isQRUnlockable: true },
          null,
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

            <ImageUpload
              label="Locked Image"
              imagePreview={lockedImagePreview}
              imageError={lockedImageError}
              onImageSelect={handleLockedImageSelect}
              onImageRemove={handleLockedImageRemove}
              altText="Locked stamp image preview"
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a hackathon" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                    <FormDescription className="text-xs">
                      If enabled, hackers will not see this stamp until unlocked.
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
              name="isTitle"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Title Stamp</FormLabel>
                    <FormDescription className="text-xs">
                      Displayed first on the stampbook page. Only one stamp per hackathon can be the
                      title stamp.
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
                    <FormDescription className="text-xs">
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

            <FormField
              control={form.control}
              name="isEventUnlockable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Event Unlockable</FormLabel>
                    <FormDescription className="text-xs">
                      If enabled, organizers can explicitly unlock this stamp for a hacker through the
                      check-in app.
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
                      if (!activeStamp?.qrURL) return;
                      const link = document.createElement("a");
                      link.href = activeStamp.qrURL;
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

