import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getNestedValue } from "@/lib/utils";
import { useEvaluator } from "@/providers/evaluator-provider";
import { RESPONSE_VISIBLE_FIELDS } from "./constants";
import { Response, type ResponseType } from "./response";

export function ApplicantResponse() {
  const { focusedApplicant, questionLabels } = useEvaluator();

  if (!focusedApplicant) {
    return (
      <Card className="items-center justify-center gap-5 rounded-xl">
        <img className="select-none" src="/teapots.svg" draggable={false} />
        <div>Select a hacker application on the left panel.</div>
      </Card>
    );
  }

  return (
    <Card key={focusedApplicant?._id}>
      <CardHeader>
        <CardTitle>Applicant response</CardTitle>
        <CardDescription>ID: {focusedApplicant?._id}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {RESPONSE_VISIBLE_FIELDS.map((fieldConfig) => (
          <Response
            key={fieldConfig.field}
            label={questionLabels[fieldConfig.field] || fieldConfig.label}
            type={fieldConfig.type as ResponseType}
            response={
              getNestedValue(focusedApplicant, fieldConfig.field)
            }
            userId={focusedApplicant?._id}
          />
        ))}
      </CardContent>
    </Card>
  );
}
