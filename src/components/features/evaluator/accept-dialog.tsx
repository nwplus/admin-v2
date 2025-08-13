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
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import type { ApplicantEducationLevel } from "@/lib/firebase/types";
import { useEvaluator } from "@/providers/evaluator-provider";
import { acceptApplicants, getApplicantsToAccept } from "@/services/evaluator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const CONTRIBUTION_ROLE_OPTIONS: MultiSelectOption[] = [
  {
    label: "Designer",
    value: "designer",
  },
  {
    label: "Developer",
    value: "developer",
  },
  {
    label: "Product Manager",
    value: "productManager",
  },
  {
    label: "Other",
    value: "other",
  },
];

const YEAR_LEVEL_OPTIONS: Array<{ label: ApplicantEducationLevel; value: ApplicantEducationLevel }> = [
  { label: "Less than Secondary / High School", value: "Less than Secondary / High School" },
  { label: "Secondary / High School", value: "Secondary / High School" },
  {
    label: "Undergraduate University (2 year - community college or similar)",
    value: "Undergraduate University (2 year - community college or similar)",
  },
  { label: "Undergraduate University (3+ years)", value: "Undergraduate University (3+ years)" },
  {
    label: "Graduate University (Masters, Doctoral, Professional, etc.)",
    value: "Graduate University (Masters, Doctoral, Professional, etc.)",
  },
  { label: "Code School / Bootcamp", value: "Code School / Bootcamp" },
  {
    label: "Other Vocational / Trade Program or Apprenticeship",
    value: "Other Vocational / Trade Program or Apprenticeship",
  },
  { label: "Post-Doctorate", value: "Post-Doctorate" },
  { label: "I'm not currently a student", value: "I'm not currently a student" },
  { label: "Prefer not to answer", value: "Prefer not to answer" },
];

const formSchema = z.object({
  minScore: z.coerce.number().optional(),
  minZScore: z.coerce.number().optional(),
  minPrevHacks: z.coerce.number().optional(),
  maxPrevHacks: z.coerce.number().optional(),
  contributionRoles: z.array(z.string()).optional(),
  yearLevels: z.array(z.string()).optional(),
  minExperiencesScore: z.coerce.number().optional(),
  maxExperiencesScore: z.coerce.number().optional(),
});

const BASE_VALUES: z.infer<typeof formSchema> = {
  minScore: undefined,
  minZScore: undefined,
  minPrevHacks: undefined,
  maxPrevHacks: undefined,
  contributionRoles: undefined,
  yearLevels: undefined,
  minExperiencesScore: undefined,
  maxExperiencesScore: undefined,
};

export function AcceptDialog() {
  const { hackathon } = useEvaluator();
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [affectedApplicantIds, setAffectedApplicantsId] = useState<string[] | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: BASE_VALUES,
  });

  const close = () => {
    form.reset();
    setAffectedApplicantsId(null);
    setOpen(false);
  };

  const onCalculate = async () => {
    if (isCalculating) return;
    const formData = form.getValues();
    setIsCalculating(true);

    const applicants = await getApplicantsToAccept(
      hackathon,
      formData.minScore,
      formData.minZScore,
      formData.minPrevHacks,
      formData.maxPrevHacks,
      formData.yearLevels,
      formData.contributionRoles,
      formData.minExperiencesScore,
      formData.maxExperiencesScore,
    );

    setAffectedApplicantsId(applicants?.map((a) => a._id));
    setIsCalculating(false);
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
          <form className="space-y-4">
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="minScore"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Minimum score</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Optional" {...field} />
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
                      <Input type="number" placeholder="Optional" {...field} />
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
                      <Input type="number" placeholder="Optional" {...field} />
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
                      <Input type="number" placeholder="Optional" {...field} />
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
                      <Input type="number" placeholder="Optional" {...field} />
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
                      <Input type="number" placeholder="Optional" {...field} />
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
              <Confirm
                sideEffect={onCalculate}
                variant="default"
                onConfirm={onAccept}
                header={`Accept ${affectedApplicantIds?.length ?? 0} hackers`}
                description={`Acceptances will reflect on hackers' portals immediately.`}
              >
                Calculate acceptances
              </Confirm>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
