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
import { useEvaluator } from "@/providers/evaluator-provider";
import { acceptApplicants, getApplicantsToAccept } from "@/services/evaluator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  minScore: z.number().optional(),
  minZScore: z.number().optional(),
  minPrevHacks: z.number().optional(),
  maxPrevHacks: z.number().optional(),
  contributionRoles: z.array(z.string()).optional(),
  yearLevels: z.array(z.string()).optional(),
});

const BASE_VALUES = {
  minScore: undefined,
  minZScore: undefined,
  minPrevHacks: undefined,
  maxPrevHacks: undefined,
  contributionRoles: undefined,
  yearLevels: undefined,
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
                      <Input placeholder="Optional" {...field} />
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
                      <Input placeholder="Optional" {...field} />
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
                      <Input placeholder="Optional" {...field} />
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
                      <Input placeholder="Optional" {...field} />
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
                const contributionOptions: MultiSelectOption[] = [
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
                return (
                  <FormItem>
                    <FormLabel>Contribution roles</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={contributionOptions}
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
