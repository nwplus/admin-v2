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
import { MultiSelect } from "@/components/ui/multi-select";
import { useEvaluator } from "@/providers/evaluator-provider";
import { acceptApplicants, getApplicantsToAccept } from "@/services/evaluator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
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

});

const BASE_VALUES: z.infer<typeof formSchema> = {

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


export function AcceptDialog() {
  const { hackathon } = useEvaluator();
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [affectedApplicantIds, setAffectedApplicantsId] = useState<string[] | null>(null);

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    values: BASE_VALUES,
  });

  const close = () => {
    form.reset();
    setAffectedApplicantsId(null);
    setOpen(false);
  };

  const onCalculate = async (values: FormValues) => {
    if (isCalculating) return;
    const formData = form.getValues();
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
    if (!affectedApplicantIds || affectedApplicantIds?.length < 1) {
      toast("No applications to accept");
      return;
    }

    setLoading(true);
    try {
      await acceptApplicants(hackathon, affectedApplicantIds);
      toast(`${affectedApplicantIds?.length} hackers successfully accepted`);
    } catch (error) {
      console.error(error);
      toast("Error accepting applicants");
    } finally {
      setLoading(false);
    }
    close();
  };

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
      <DialogContent>
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
            {/* {isCalculating ? (
              <Skeleton />
            ) : (
              affectedApplicantIds && (
                <Alert variant="default">
                  <AlertTitle>Affected applicants</AlertTitle>
                  <AlertDescription>
                    You'll be accepting {affectedApplicantIds?.length ?? 0} hackers.
                  </AlertDescription>
                </Alert>
              )
            )} */}
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
