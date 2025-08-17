import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, Upload, X } from "lucide-react";
import { useRef } from "react";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

interface ImageUploadProps {
  label: string;
  imagePreview: string | null;
  imageError: string | null;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  altText?: string;
}

export function ImageUpload({
  label,
  imagePreview,
  imageError,
  onImageSelect,
  onImageRemove,
  altText = "Image preview",
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div key={imagePreview} className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt={altText}
                className="aspect-square h-24 w-24 flex-grow rounded-md bg-theme-light object-contain p-4 shadow-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="-top-2 -right-2 absolute h-6 w-6 rounded-full p-0"
                onClick={onImageRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-md border-2 border-gray-300 border-dashed bg-gray-50">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-grow space-y-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            onChange={onImageSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {imagePreview ? "Change Image" : "Upload Image"}
          </Button>
          <p className="text-neutral-500 text-sm">Max 5MB. Supports JPG, PNG formats.</p>
          {imageError && <p className="text-red-600 text-sm">{imageError}</p>}
        </div>
      </div>
    </div>
  );
}
