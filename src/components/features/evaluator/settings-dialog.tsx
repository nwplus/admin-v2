import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEvaluator } from "@/providers/evaluator-provider";
import { setAdminFlags } from "@/services/evaluator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const scoreNumber = z.coerce
  .number()
  .int("Score must be an integer")
  .min(-10, "Score cannot be less than -10")
  .max(10, "Score cannot be greater than 10");

const scoringCriteriaSchema = z
  .object({
    label: z.string(),
    field: z.string(),
    minScore: scoreNumber,
    maxScore: scoreNumber,
    increments: z.coerce.number().positive(),
    weight: z.coerce.number().nonnegative(),
  })
  .refine((data) => data.minScore < data.maxScore, {
    message: "minScore must be less than maxScore",
    path: ["minScore"],
  });

const formSchema = z.object({
  activeHackathon: z.string().min(2).max(10000),
  scoringCriteria: z.array(scoringCriteriaSchema),
});

interface FAQDialogProps {
  open: boolean;
  hackathonIds: string[];
  onClose: () => void;
}

export function SettingsDialog({ open, onClose, hackathonIds }: FAQDialogProps) {
  const { hackathon, scoringCriteria, setScoringCriteria, setHackathon } = useEvaluator();

  const [loading, setLoading] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      activeHackathon: hackathon,
      scoringCriteria: scoringCriteria ?? [],
    },
    mode: "onChange",
    shouldUnregister: false,
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "scoringCriteria",
  });

  const handleSave = async (values: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);
    try {
      await setAdminFlags({
        activeHackathon: values.activeHackathon,
        evaluator: {
          criteria: values.scoringCriteria,
        },
      });
      setHackathon(values.activeHackathon);
      setScoringCriteria(values.scoringCriteria);
      toast("Evaluator settings saved");
      onClose();
    } catch (error) {
      toast.error("Failed to save evaluator settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Evaluator settings</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="activeHackathon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Active hackathon</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? hackathon}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {hackathonIds?.map((id) => (
                        <SelectItem key={id} value={id}>
                          {id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-3">
              <FormLabel>Scoring criteria</FormLabel>
              {fields.map((criteria, index) => (
                <div key={criteria.id} className="flex flex-col gap-3 rounded-lg border p-3">
                  <div className="font-medium text-sm">{criteria.label}</div>
                  <input type="hidden" {...form.register(`scoringCriteria.${index}.label`)} />
                  <input type="hidden" {...form.register(`scoringCriteria.${index}.field`)} />
                  <input type="hidden" {...form.register(`scoringCriteria.${index}.weight`)} />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name={`scoringCriteria.${index}.minScore`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min score</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="1"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`scoringCriteria.${index}.maxScore`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max score</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value === "" ? "" : Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`scoringCriteria.${index}.increments`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Increment</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(val) => field.onChange(Number(val))}
                              value={field.value !== undefined ? String(field.value) : undefined}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select increment" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0.5">0.5</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button disabled={loading} type="submit">
                  Save changes
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
