import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  type ApplicantResumeFile,
  downloadApplicantResume,
  getApplicantResumeFile,
} from "@/lib/firebase/storage";
import { cn } from "@/lib/utils";
import { ExternalLink, Link } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type ResponseType = "long" | "short" | "link" | "resume" | "booleanMap";

interface ResponseProps {
  label?: string;
  type?: ResponseType;
  response?: string | Record<string, boolean>;
  userId?: string;
}

export function Response({ label, type, response, userId }: ResponseProps) {
  const [resumeState, setResumeState] = useState<{
    userId?: string;
    response?: ResponseProps["response"];
    file: ApplicantResumeFile | null;
    error: boolean;
    loading: boolean;
  }>({ file: null, error: false, loading: true });

  useEffect(() => {
    if (type !== "resume") return;
    let active = true;
    const fallback =
      typeof response === "string" && /^https?:\/\//i.test(response.trim())
        ? {
            url: response.trim(),
            filename: `resume${
              response
                .trim()
                .split(/[?#]/)[0]
                .match(/\.(pdf|docx?|png|jpe?g)$/i)?.[0] ?? ""
            }`,
          }
        : null;
    setResumeState({ userId, response, file: null, error: false, loading: true });
    (async () => {
      try {
        const file = userId ? await getApplicantResumeFile(userId) : null;
        if (active)
          setResumeState({
            userId,
            response,
            file: file ?? fallback,
            error: false,
            loading: false,
          });
      } catch {
        if (active)
          setResumeState({ userId, response, file: fallback, error: !fallback, loading: false });
      }
    })();
    return () => {
      active = false;
    };
  }, [type, userId, response]);
  const currentResume = resumeState.userId === userId && resumeState.response === response;

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {type === "long" ? (
        <Textarea value={response as string} readOnly />
      ) : type === "short" ? (
        <Input value={response as string} readOnly />
      ) : type === "booleanMap" ? (
        <BooleanMap value={response as Record<string, boolean>} />
      ) : type === "resume" ? (
        <ResumeField
          file={currentResume ? resumeState.file : null}
          loading={!currentResume || resumeState.loading}
          error={currentResume && resumeState.error}
        />
      ) : (
        <LinkField href={response as string} />
      )}
    </div>
  );
}

const BooleanMap = ({ value }: { value?: Record<string, boolean> }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {value &&
        Object.entries(value)
          .filter(([_, value]) => value === true)
          .map(([key, _]) => <Badge key={key}>{key}</Badge>)}
    </div>
  );
};

const ResumeField = ({
  file,
  loading,
  error,
}: {
  file: ApplicantResumeFile | null;
  loading: boolean;
  error: boolean;
}) => {
  const [downloading, setDownloading] = useState(false);
  if (loading) return <Skeleton />;
  if (error) return <p role="alert">Unable to load resume.</p>;
  if (!file) return <Input value="" readOnly placeholder="No response" />;

  const handleClipboard = async () => {
    try {
      await navigator.clipboard.writeText(file.url);
      toast("Copied link to clipboard!");
    } catch {
      toast.error("Unable to copy resume link.");
    }
  };
  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadApplicantResume(file);
    } catch {
      toast.error("Unable to download resume. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge>Uploaded</Badge>
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
      >
        {/\.docx?$/i.test(file.filename) ? "Open original resume" : "View resume"}
        <ExternalLink />
      </a>
      <Button variant="outline" disabled={downloading} onClick={handleDownload}>
        {downloading ? "Downloading…" : "Download resume"}
      </Button>
      <Button size="icon" variant="outline" aria-label="Copy resume link" onClick={handleClipboard}>
        <Link />
      </Button>
    </div>
  );
};

const LinkField = ({ href }: { href?: string }) => {
  const value = href ?? "";
  const isUrl = /^https?:\/\//i.test(value.trim());

  const handleClipboard = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast("Copied link to clipboard!");
  };

  if (!isUrl) {
    return <Input value={value} readOnly placeholder={value ? undefined : "No response"} />;
  }

  return (
    <div className="relative flex items-center gap-2">
      <a
        href={value}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(buttonVariants({ variant: "outline" }), "flex-grow justify-between")}
      >
        <div className="flex-1 truncate">Open link in new tab</div>
        <ExternalLink />
      </a>
      <Button size="icon" variant="outline" onClick={handleClipboard}>
        <Link />
      </Button>
    </div>
  );
};
