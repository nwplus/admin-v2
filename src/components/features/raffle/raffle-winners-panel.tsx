import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Confirm } from "@/components/ui/confirm";
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
import { downloadCSV, obfuscateEmail } from "@/lib/utils";
import { deleteRaffleWinner } from "@/services/raffle";
import { Download, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";

interface RaffleWinnersPanelProps {
  hackathon: string;
  winners: RaffleWinner[];
  showEmails: boolean;
  onToggleEmails: () => void;
}

export function RaffleWinnersPanel({
  hackathon,
  winners,
  showEmails,
  onToggleEmails,
}: RaffleWinnersPanelProps) {
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
    <Card className="flex w-full flex-col rounded-xl lg:w-96">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          Winners
          <Badge variant="secondary">{winners.length}</Badge>
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleEmails}
            aria-label={showEmails ? "Hide emails" : "Show emails"}
            title={showEmails ? "Hide emails" : "Show emails"}
          >
            {showEmails ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExport}
            disabled={winners.length === 0}
            aria-label="Export winners as CSV"
            title="Export winners as CSV"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {winners.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">
            No winners drawn yet. They'll show up here as you confirm each draw.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 px-2 text-xs">Prize</TableHead>
                <TableHead className="h-8 px-2 text-xs">Preferred</TableHead>
                <TableHead className="h-8 px-2 text-xs">Last</TableHead>
                <TableHead className="h-8 px-2 text-xs">Email</TableHead>
                <TableHead className="h-8 px-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {winners.map((winner) => (
                <TableRow key={winner._id}>
                  <TableCell className="px-2 py-2 text-xs">{winner.prizeName}</TableCell>
                  <TableCell className="px-2 py-2 font-medium text-xs">
                    {winner.preferredName}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-xs">{winner.lastName || "—"}</TableCell>
                  <TableCell className="px-2 py-2 text-muted-foreground text-xs">
                    {showEmails ? winner.email : obfuscateEmail(winner.email)}
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    <Confirm
                      variant="outline"
                      size="icon"
                      className="w-7"
                      header="Remove this winner?"
                      description={`${winner.preferredName} will be removed from the log for "${winner.prizeName}", freeing the prize up to be drawn again.`}
                      onConfirm={() => handleDelete(winner)}
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </Confirm>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
