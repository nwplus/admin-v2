import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Switch } from "@/components/ui/switch";
import { useEvaluator } from "@/providers/evaluator-provider";
import { deleteApplicantScores, setAdminFlags } from "@/services/evaluator";
import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
    weight: z.coerce.number().positive(),
    isDisabled: z.coerce.boolean(),
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
  const { applicants, hackathon, scoringCriteria, setScoringCriteria, setHackathon } =
    useEvaluator();

  const [loading, setLoading] = useState<boolean>(false);

  const initialCriteria =
    scoringCriteria?.map((criteria) => ({
      ...criteria,
    })) ?? [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      activeHackathon: hackathon,
      scoringCriteria: initialCriteria,
    },
    mode: "onChange",
    shouldUnregister: false,
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "scoringCriteria",
  });

  const watchedCriteria = useWatch({
    control: form.control,
    name: "scoringCriteria",
  });

  const disabledCriteriaFields = useMemo(() => {
    return new Set((watchedCriteria ?? []).filter((f) => f?.isDisabled).map((f) => f.field));
  }, [watchedCriteria]);

  const mismatchApplicants = useMemo(() => {
    const mismatchApplicantIds: string[] = [];
    for (const applicant of applicants) {
      const applicantHasDisabled = Object.keys(applicant?.score?.scores ?? {}).some((f) =>
        disabledCriteriaFields.has(f),
      );
      if (applicantHasDisabled) {
        mismatchApplicantIds.push(applicant._id);
      }
    }
    return mismatchApplicantIds;
  }, [applicants, disabledCriteriaFields]);

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

      if (mismatchApplicants.length > 0) {
        await deleteApplicantScores(
          values.activeHackathon,
          mismatchApplicants,
          disabledCriteriaFields,
        );
      }

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
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      >
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
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{criteria.label}</div>
                    <FormField
                      control={form.control}
                      name={`scoringCriteria.${index}.isDisabled`}
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormLabel className="text-neutral-500 text-xs">
                            {field.value ? "Disabled" : "Enabled"}
                          </FormLabel>
                          <FormControl>
                            <Switch
                              checked={!field.value}
                              onCheckedChange={(checked) => field.onChange(!checked)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <input type="hidden" {...form.register(`scoringCriteria.${index}.label`)} />
                  <input type="hidden" {...form.register(`scoringCriteria.${index}.field`)} />
                  <input type="hidden" {...form.register(`scoringCriteria.${index}.weight`)} />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                      name={`scoringCriteria.${index}.weight`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight</FormLabel>
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
                              <SelectTrigger className="w-full">
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
              {mismatchApplicants.length > 0 && (
                <Alert>
                  <InfoIcon />
                  <AlertTitle>Heads up!</AlertTitle>
                  <AlertDescription>
                    There are {mismatchApplicants.length} applicant(s) that have a score for a
                    disabled field. Saving these settings will delete those scores and deduct from
                    their total score.
                  </AlertDescription>
                </Alert>
              )}
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
