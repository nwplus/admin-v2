import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { type AcceptancePlan, MAX_RATIO_DEVIATION_POINTS, planAcceptance } from "@/lib/acceptance";
import { useEvaluator } from "@/providers/evaluator-provider";
import { acceptApplicants, getApplicantsToAccept } from "@/services/evaluator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CONTRIBUTION_ROLE_OPTIONS, YEAR_LEVEL_OPTIONS } from "./constants";

const blankToUndefined = (value?: string) =>
  value === undefined || value.trim() === "" ? undefined : Number(value);

const optionalNumber = z
  .string()
  .optional()
  .transform(blankToUndefined)
  .pipe(z.number({ invalid_type_error: "Enter a number" }).optional());

const optionalCount = z
  .string()
  .optional()
  .transform(blankToUndefined)
  .pipe(
    z
      .number({ invalid_type_error: "Enter a number" })
      .int("Enter a whole number")
      .positive("Enter a number greater than 0")
      .optional(),
  );

const optionalPercentage = z
  .string()
  .optional()
  .transform(blankToUndefined)
  .pipe(
    z
      .number({ invalid_type_error: "Enter a number" })
      .min(0, "Enter a number between 0 and 100")
      .max(100, "Enter a number between 0 and 100")
      .optional(),
  );

const formSchema = z
  .object({
    minScore: optionalNumber,
    minZScore: optionalNumber,
    minPrevHacks: optionalNumber,
    maxPrevHacks: optionalNumber,
    contributionRoles: z.array(z.string()).optional(),
    yearLevels: z.array(z.string()).optional(),
    minExperiencesScore: optionalNumber,
    maxExperiencesScore: optionalNumber,
    totalToAccept: optionalCount,
    beginnerPercentage: optionalPercentage,
  })
  .superRefine((values, ctx) => {
    if (values.beginnerPercentage !== undefined && values.totalToAccept === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["beginnerPercentage"],
        message: "Set a total number of hackers to use a ratio",
      });
    }
  });

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

const BASE_VALUES: FormInput = {
  minScore: undefined,
  minZScore: undefined,
  minPrevHacks: undefined,
  maxPrevHacks: undefined,
  contributionRoles: undefined,
  yearLevels: undefined,
  minExperiencesScore: undefined,
  maxExperiencesScore: undefined,
  totalToAccept: undefined,
  beginnerPercentage: undefined,
};

interface Preview {
  plan: AcceptancePlan;
  total?: number;
  beginnerPercentage?: number;
}

export function AcceptDialog() {
  const { hackathon } = useEvaluator();
  const experiencedPercentageId = useId();
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    values: BASE_VALUES,
  });

  // a preview only describes the filters it was calculated with, so drop it as soon as they change
  // this is a bit of a hack, but react-hook-form doesn't provide a way to watch all fields at once
  useEffect(() => {
    const subscription = form.watch(() => setPreview(null));
    return () => subscription.unsubscribe();
  }, [form]);

  const beginnerPercentage = useWatch({ control: form.control, name: "beginnerPercentage" });
  const experiencedPercentage = calculateExperiencedPercentage(beginnerPercentage);

  const close = () => {
    form.reset();
    setPreview(null);
    setOpen(false);
  };

  const onCalculate = async (values: FormValues) => {
    if (isCalculating) return;
    setIsCalculating(true);

    try {
      const applicants = await getApplicantsToAccept(
        hackathon,
        values.minScore,
        values.minZScore,
        values.minPrevHacks,
        values.maxPrevHacks,
        values.yearLevels,
        values.contributionRoles,
        values.minExperiencesScore,
        values.maxExperiencesScore,
      );

      setPreview({
        plan: planAcceptance(applicants ?? [], {
          total: values.totalToAccept,
          beginnerPercentage: values.beginnerPercentage,
        }),
        total: values.totalToAccept,
        beginnerPercentage: values.beginnerPercentage,
      });
    } catch (error) {
      console.error(error);
      toast("Error calculating acceptances");
    } finally {
      setIsCalculating(false);
    }
  };

  const onAccept = async () => {
    if (loading) return;
    const acceptIds = preview?.plan.ids;
    if (!acceptIds || acceptIds.length < 1) {
      toast("No applications to accept");
      return;
    }

    setLoading(true);
    try {
      await acceptApplicants(hackathon, acceptIds);
      toast(`${acceptIds.length} hackers successfully accepted`);
    } catch (error) {
      console.error(error);
      toast("Error accepting applicants");
    } finally {
      setLoading(false);
    }
    close();
  };

  const plan = preview?.plan;
  const canAccept = !!plan && plan.ids.length > 0 && !plan.exceedsRatioLimit;

  return (
    <Dialog
      open={open}
      onOpenChange={(state: boolean) => {
        if (state) {
          setOpen(true);
        } else {
          close();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="flex-grow">Accept Hackers</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Accept applicants</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onCalculate)}>
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="minScore"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Minimum score</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Optional"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minZScore"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Minimum z-score</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Optional"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="minPrevHacks"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Minimum hackathons</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Optional"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxPrevHacks"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Maximum hackathons</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Optional"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="contributionRoles"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Contribution roles</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={CONTRIBUTION_ROLE_OPTIONS}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Select roles..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="yearLevels"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Year levels</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={YEAR_LEVEL_OPTIONS}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Select year levels..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="minExperiencesScore"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Number of experiences (Min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Optional"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxExperiencesScore"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Number of experiences (Max)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Optional"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-3 rounded-lg border p-3">
              <div className="font-medium text-sm">Proportional acceptance</div>
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="totalToAccept"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Total hackers</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Optional"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="beginnerPercentage"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Beginners (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Optional"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid flex-grow content-start gap-2">
                  <Label htmlFor={experiencedPercentageId}>Experienced (%)</Label>
                  <Input
                    id={experiencedPercentageId}
                    type="number"
                    placeholder="—"
                    value={experiencedPercentage}
                    readOnly
                    disabled
                  />
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                Beginners have attended 0–1 hackathons, everyone else counts as experienced. Leave
                these blank to accept every applicant matching the filters.
              </p>
            </div>
            {plan && (
              <AcceptancePreview
                plan={plan}
                total={preview?.total}
                beginnerPercentage={preview?.beginnerPercentage}
              />
            )}
            <div className="flex flex-center gap-2">
              <Button type="submit" className="flex-grow" disabled={isCalculating}>
                {isCalculating ? "Calculating..." : "Calculate acceptances"}
              </Button>
              {plan &&
                (canAccept ? (
                  <Confirm
                    className="flex-grow"
                    variant="default"
                    onConfirm={onAccept}
                    header={`Accept ${plan.ids.length} hackers`}
                    description={`${plan.selected.beginner} beginner and ${plan.selected.experienced} experienced hackers. Acceptances will reflect on hackers' portals immediately.`}
                  >
                    Accept {plan.ids.length} hackers
                  </Confirm>
                ) : (
                  <Button type="button" variant="secondary" className="flex-grow" disabled>
                    {plan.exceedsRatioLimit ? "Ratio out of range" : "Nothing to accept"}
                  </Button>
                ))}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * mirrors the beginner percentage input to show the experienced percentage, or blank if the input is invalid
 */
const calculateExperiencedPercentage = (beginnerPercentage?: string) => {
  const entered = (beginnerPercentage ?? "").trim();
  const parsed = entered === "" ? Number.NaN : Number(entered);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) return "";
  return String(100 - parsed);
};

function AcceptancePreview({
  plan,
  total,
  beginnerPercentage,
}: {
  plan: AcceptancePlan;
  total?: number;
  beginnerPercentage?: number;
}) {
  const { selected, target, available, finalBeginnerPercentage } = plan;
  const shortGroup = selected.beginner < target.beginner ? "beginner" : "experienced";
  const overflowGroup = shortGroup === "beginner" ? "experienced" : "beginner";
  const movedSpots = selected[overflowGroup] - target[overflowGroup];

  return (
    <Alert variant={plan.exceedsRatioLimit ? "destructive" : "default"}>
      <AlertTitle>
        {plan.exceedsRatioLimit
          ? "Ratio cannot be met"
          : `You'll be accepting ${selected.total} hackers`}
      </AlertTitle>
      <AlertDescription>
        <p>
          {selected.beginner} beginner, {selected.experienced} experienced
          {finalBeginnerPercentage !== null &&
            ` (${finalBeginnerPercentage}% / ${round(100 - finalBeginnerPercentage)}%)`}
        </p>
        {plan.isUnderfilled && total !== undefined && (
          <p>
            Only {selected.total} of the {total} requested hackers match these filters.
          </p>
        )}
        {plan.hasOverflow && (
          <p>
            Only {available[shortGroup]} {shortGroup} applicants are available, so {movedSpots} spot
            {movedSpots === 1 ? "" : "s"} moved to {overflowGroup} hackers.
          </p>
        )}
        {plan.exceedsRatioLimit && beginnerPercentage !== undefined && (
          <p>
            That is more than {MAX_RATIO_DEVIATION_POINTS} points off the {beginnerPercentage}%
            beginner split you asked for. Lower the total or change the percentage to continue.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}

const round = (value: number) => Math.round(value * 10) / 10;
