import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { RafflePrize, RaffleWinner } from "@/lib/firebase/types";
import { drawnCountForPrize } from "@/lib/raffle";
import { deleteRafflePrize, upsertRafflePrize } from "@/services/raffle";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Pencil, Plus, X } from "lucide-react";
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

interface RafflePrizesDialogProps {
  open: boolean;
  onClose: () => void;
  hackathon: string;
  prizes: RafflePrize[];
  winners: RaffleWinner[];
}

export function RafflePrizesDialog({
  open,
  onClose,
  hackathon,
  prizes,
  winners,
}: RafflePrizesDialogProps) {
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

  const close = () => {
    cancelEdit();
    form.reset(EMPTY_FORM);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) close();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Raffle prizes</DialogTitle>
          <DialogDescription className="text-xs">
            Set these up before the event. Quantity is how many winners get drawn for the prize.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {prizes.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground text-sm">No prizes yet</p>
          ) : (
            prizes.map((prize) => {
              const drawn = drawnCountForPrize(winners, prize._id);
              const isEditing = editing?.id === prize._id;

              return (
                <div
                  key={prize._id}
                  className="flex items-center gap-2 rounded-md border p-2 text-sm"
                >
                  {isEditing && editing ? (
                    <>
                      <Input
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        placeholder="Prize name"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min={1}
                        value={editing.quantity}
                        onChange={(e) =>
                          setEditing({ ...editing, quantity: Number(e.target.value) })
                        }
                        className="w-20"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={loading}
                        onClick={() => saveEdit(prize)}
                        aria-label="Save prize"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={cancelEdit}
                        aria-label="Cancel editing prize"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-medium">{prize.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {drawn}/{prize.quantity} drawn
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEdit(prize)}
                        aria-label={`Edit ${prize.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Confirm
                        variant="outline"
                        size="icon"
                        className="w-9"
                        description={
                          drawn > 0
                            ? `${drawn} winner${drawn === 1 ? " has" : "s have"} already been drawn for "${prize.name}". They stay in the winners log, but the prize can no longer be drawn.`
                            : `"${prize.name}" will be removed from the prize list.`
                        }
                        onConfirm={() => onDelete(prize)}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Confirm>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex items-start gap-2 border-t pt-4"
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
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
