import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Confirm } from "@/components/ui/confirm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RafflePrize, RaffleWinner } from "@/lib/firebase/types";
import { drawnCountForPrize } from "@/lib/raffle";
import { cn } from "@/lib/utils";
import { deleteRafflePrize, upsertRafflePrize } from "@/services/raffle";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const EMPTY_FORM = {
  name: "",
  quantity: 1,
};

const formSchema = z.object({
  name: z.string().trim().min(1, "Give the prize a name").max(100),
  quantity: z.coerce.number().int().min(1, "At least 1 winner").max(999),
});

interface PrizeDraft {
  id: string;
  name: string;
  quantity: number;
}

interface RafflePrizesCardProps {
  hackathon: string;
  prizes: RafflePrize[];
  winners: RaffleWinner[];
  className?: string;
}

export function RafflePrizesCard({ hackathon, prizes, winners, className }: RafflePrizesCardProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [editing, setEditing] = useState<PrizeDraft | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY_FORM,
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);
    try {
      const created = await upsertRafflePrize(hackathon, {
        name: values.name,
        quantity: values.quantity,
        order: prizes.length,
      });
      if (!created) throw new Error("Error upserting a raffle prize");

      form.reset(EMPTY_FORM);
      toast.success(`Added "${values.name}"`);
    } catch (error) {
      console.error("Error adding a raffle prize", error);
      toast.error("Something went wrong adding this prize");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (prize: RafflePrize) => {
    if (prize._id) setEditing({ id: prize._id, name: prize.name, quantity: prize.quantity });
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async (prize: RafflePrize) => {
    if (loading || !editing) return;

    const parsed = formSchema.safeParse({ name: editing.name, quantity: editing.quantity });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    const alreadyDrawn = drawnCountForPrize(winners, editing.id);
    if (parsed.data.quantity < alreadyDrawn) {
      toast.error(`${alreadyDrawn} winners are already drawn for this prize`);
      return;
    }

    setLoading(true);
    try {
      const updated = await upsertRafflePrize(
        hackathon,
        { ...parsed.data, order: prize.order ?? 0 },
        editing.id,
      );
      if (!updated) throw new Error("Error upserting a raffle prize");

      toast.success("Prize updated");
      cancelEdit();
    } catch (error) {
      console.error("Error editing a raffle prize", error);
      toast.error("Something went wrong editing this prize");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (prize: RafflePrize) => {
    if (loading || !prize._id) return;
    setLoading(true);
    try {
      await deleteRafflePrize(hackathon, prize._id);
      toast.success(`Deleted "${prize.name}"`);
      if (editing?.id === prize._id) cancelEdit();
    } catch (error) {
      console.error("Error deleting a raffle prize", error);
      toast.error("Something went wrong deleting this prize");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={cn("gap-0 rounded-lg", className)}>
      <CardContent className="max-h-[450px] overflow-y-auto px-8">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 px-2 font-medium text-muted-foreground text-sm">
                Prize
              </TableHead>
              <TableHead className="h-10 w-8 px-2" />
              <TableHead className="h-10 w-8 px-2" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {prizes.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground text-sm">
                  No prizes yet. Add one below.
                </TableCell>
              </TableRow>
            ) : (
              prizes.map((prize) => {
                const drawn = drawnCountForPrize(winners, prize._id);
                // a local so TypeScript keeps the narrowing inside the callbacks below
                const draft = editing?.id === prize._id ? editing : null;

                if (draft) {
                  return (
                    <TableRow key={prize._id} className="hover:bg-transparent">
                      <TableCell className="px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <Input
                            value={draft.name}
                            onChange={(e) => setEditing({ ...draft, name: e.target.value })}
                            placeholder="Prize name"
                            className="h-8 flex-1"
                          />
                          <Input
                            type="number"
                            min={1}
                            value={draft.quantity}
                            onChange={(e) =>
                              setEditing({ ...draft, quantity: Number(e.target.value) })
                            }
                            aria-label="Quantity"
                            className="h-8 w-16"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          disabled={loading}
                          onClick={() => saveEdit(prize)}
                          aria-label="Save prize"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={cancelEdit}
                          aria-label="Cancel editing prize"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={prize._id} className="hover:bg-transparent">
                    <TableCell className="px-2 py-2 font-medium text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate">{prize.name}</span>
                        <span className="shrink-0 font-normal text-muted-foreground text-xs">
                          {drawn}/{prize.quantity} drawn
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => startEdit(prize)}
                        aria-label={`Edit ${prize.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="px-2 py-2">
                      <Confirm
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        description={
                          drawn > 0
                            ? `${drawn} winner${drawn === 1 ? " has" : "s have"} already been drawn for "${prize.name}". They stay in the winners log, but the prize can no longer be drawn.`
                            : `"${prize.name}" will be removed from the prize list.`
                        }
                        onConfirm={() => onDelete(prize)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Confirm>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-4 flex items-start gap-2 border-t px-8 pt-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Prize</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Keychron K2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem className="w-24">
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading} className="mt-6">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </Form>
    </Card>
  );
}
