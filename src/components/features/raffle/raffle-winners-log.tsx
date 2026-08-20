import { PageHeader } from "@/components/graphy/typo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Confirm } from "@/components/ui/confirm";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RaffleWinner } from "@/lib/firebase/types";
import { generateWinnersCSV } from "@/lib/raffle";
import { cn, downloadCSV, obfuscateEmail } from "@/lib/utils";
import { deleteRaffleWinner } from "@/services/raffle";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface RaffleWinnersLogProps {
  hackathon: string;
  winners: RaffleWinner[];
  showEmails: boolean;
  onToggleEmails: (shown: boolean) => void;
  className?: string;
}

export function RaffleWinnersLog({
  hackathon,
  winners,
  showEmails,
  onToggleEmails,
  className,
}: RaffleWinnersLogProps) {
  const handleExport = () => {
    const filename = `raffle-winners-${hackathon}-${new Date().toISOString().split("T")[0]}.csv`;
    downloadCSV(generateWinnersCSV(winners), filename);
    toast.success(`Exported ${winners.length} winner${winners.length === 1 ? "" : "s"}`);
  };

  const handleDelete = async (winner: RaffleWinner) => {
    if (!winner._id) return;
    try {
      await deleteRaffleWinner(hackathon, winner._id);
      toast.success("Removed from the winners log");
    } catch (error) {
      console.error("Error deleting raffle winner:", error);
      toast.error("Failed to remove this winner");
    }
  };

  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader className="font-medium">Winners Log</PageHeader>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="show-email" checked={showEmails} onCheckedChange={onToggleEmails} />
            <Label htmlFor="show-email" className="font-medium text-sm">
              Show Email
            </Label>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={winners.length === 0}>
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="rounded-lg">
        <CardContent className="max-h-[450px] overflow-y-auto px-8">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 px-2 font-medium text-muted-foreground text-sm">
                  Prize
                </TableHead>
                <TableHead className="h-10 px-2 font-medium text-muted-foreground text-sm">
                  Preferred Name
                </TableHead>
                <TableHead className="h-10 px-2 font-medium text-muted-foreground text-sm">
                  Last Name
                </TableHead>
                <TableHead className="h-10 px-2 font-medium text-muted-foreground text-sm">
                  Email
                </TableHead>
                <TableHead className="h-10 w-8 px-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {winners.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                    No winners drawn yet. They'll show up here as you confirm each draw.
                  </TableCell>
                </TableRow>
              ) : (
                winners.map((winner) => (
                  <TableRow key={winner._id} className="hover:bg-transparent">
                    <TableCell className="px-2 py-2 font-medium text-sm">
                      {winner.prizeName}
                    </TableCell>
                    <TableCell className="px-2 py-2 font-medium text-sm">
                      {winner.preferredName}
                    </TableCell>
                    <TableCell className="px-2 py-2 font-medium text-sm">
                      {winner.lastName || "—"}
                    </TableCell>
                    <TableCell className="px-2 py-2 font-medium text-sm">
                      {showEmails ? winner.email : obfuscateEmail(winner.email)}
                    </TableCell>
                    <TableCell className="px-2 py-2">
                      <Confirm
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        header="Remove this winner?"
                        description={`${winner.preferredName} will be removed from the log for "${winner.prizeName}", freeing the prize up to be drawn again.`}
                        onConfirm={() => handleDelete(winner)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Confirm>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
