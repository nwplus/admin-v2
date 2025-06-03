import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getApplicantResume } from "@/lib/firebase/storage";
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
  const [loading, setLoading] = useState<boolean>(true);
  const [resumeLink, setResumeLink] = useState<string | null>(null);

  useEffect(() => {
    if (type === "resume" && userId) {
      (async () => {
        const resumeLink = response ? await getApplicantResume(userId) : null;
        setResumeLink(resumeLink ?? null);
      })();
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [type, userId, response]);

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {type === "long" ? (
        <Textarea value={response as string} readOnly />
      ) : type === "short" ? (
        <Input value={response as string} readOnly />
      ) : type === "booleanMap" ? (
        <BooleanMap value={response as Record<string, boolean>} />
      ) : loading ? (
        <Skeleton />
      ) : (
        <LinkField href={resumeLink ?? (response as string)} />
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

const LinkField = ({ href }: { href?: string }) => {
  const handleClipboard = () => {
    if (!href) return;
    navigator.clipboard.writeText(href);
    toast("Copied link to clipboard!");
  };

  return (
    <div className="relative flex items-center gap-2">
      <a
        href={href}
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
