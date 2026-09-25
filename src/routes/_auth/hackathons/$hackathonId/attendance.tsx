import { PageHeader } from "@/components/graphy/typo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PreHackathonWorkshop } from "@/lib/firebase/types";
import { useHackathon } from "@/providers/hackathon-provider";
import {
  buildPreHackathonQrUrl,
  deletePreHackathonWorkshop,
  subscribeToPreHackathonWorkshops,
  upsertPreHackathonWorkshop,
} from "@/services/prehackathon";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Download, Loader2, Plus, Trash2 } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/hackathons/$hackathonId/attendance")({
  component: AttendanceComponent,
});

const toEventId = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function WorkshopQrCard({
  workshop,
  qrUrl,
  onDelete,
}: {
  workshop: PreHackathonWorkshop;
  qrUrl: string;
  onDelete: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(qrUrl, { width: 200, margin: 2 })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(console.error);
    return () => {
      active = false;
    };
  }, [qrUrl]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(qrUrl);
    toast.success("Attendance link copied");
  };

  const download = () => {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `attendance-${workshop.eventId}.png`;
    link.click();
  };

  return (
    <Card className="rounded-xl">
      <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="flex size-40 shrink-0 items-center justify-center rounded-md border bg-white p-2">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR code for ${workshop.name}`}
              className="size-full object-contain"
            />
          ) : (
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <p className="font-semibold">{workshop.name}</p>
          <p className="font-mono text-muted-foreground text-xs">{workshop.eventId}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={copyLink}>
              <Copy />
              Copy link
            </Button>
            <Button size="sm" variant="outline" onClick={download}>
              <Download />
              PNG
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 />
              Delete
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Scanning this QR opens the portal where hackers sign in and get marked attended.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function AttendanceComponent() {
  const { activeHackathon } = useHackathon();
  const [workshops, setWorkshops] = useState<PreHackathonWorkshop[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!activeHackathon) return;

    const unsubWorkshops = subscribeToPreHackathonWorkshops(activeHackathon, setWorkshops);

    return () => {
      unsubWorkshops();
    };
  }, [activeHackathon]);

  const addWorkshop = async () => {
    const eventId = toEventId(name);
    if (!eventId) {
      toast.error("Workshop name can't be empty");
      return;
    }
    if (workshops.some((workshop) => workshop.eventId === eventId)) {
      toast.error(`A workshop with slug "${eventId}" already exists`);
      return;
    }
    try {
      await upsertPreHackathonWorkshop(activeHackathon, eventId, name.trim());
      setName("");
      toast.success("Workshop added");
    } catch {
      toast.error("Failed to add workshop");
    }
  };

  const removeWorkshop = async (workshop: PreHackathonWorkshop) => {
    if (!workshop.eventId) return;
    if (
      !window.confirm(
        `Delete "${workshop.name}"? Hackers already marked attended keep their record.`,
      )
    )
      return;
    try {
      await deletePreHackathonWorkshop(activeHackathon, workshop.eventId);
      toast.success("Workshop deleted");
    } catch {
      toast.error("Failed to delete workshop");
    }
  };

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <PageHeader className="flex items-center gap-3">
        Attendance
        <Badge variant="secondary">{activeHackathon}</Badge>
      </PageHeader>

      <Card className="rounded-xl">
        <CardHeader className="gap-1">
          <p className="font-semibold">Pre-hackathon workshops</p>
          <p className="text-muted-foreground text-sm">
            Runs before the event. Hackers check in by scanning the QR on the portal.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addWorkshop();
              }}
              placeholder="e.g. Intro to React"
            />
            <Button onClick={addWorkshop}>
              <Plus />
              Add workshop
            </Button>
          </div>
          {workshops.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pre-hackathon workshops yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {workshops.map((workshop) =>
                workshop.eventId ? (
                  <WorkshopQrCard
                    key={workshop._id}
                    workshop={workshop}
                    qrUrl={buildPreHackathonQrUrl(
                      activeHackathon,
                      workshop.eventId,
                      workshop.name ?? workshop.eventId,
                    )}
                    onDelete={() => removeWorkshop(workshop)}
                  />
                ) : null,
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
