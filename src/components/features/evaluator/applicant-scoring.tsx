import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedSave } from "@/hooks/use-debounce-save";
import { getExperienceGroup } from "@/lib/acceptance";
import type { ApplicantScoreItem, RubricType, ScoringCriteria } from "@/lib/firebase/types";
import { useAuth } from "@/providers/auth-provider";
import { useEvaluator } from "@/providers/evaluator-provider";
import { updateApplicant } from "@/services/evaluator";
import { Timestamp } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

export function ApplicantScoring() {
  const { user } = useAuth();
  const { hackathon, focusedApplicant, scoringCriteria } = useEvaluator();
  const enabledScoringCriteria = scoringCriteria.filter((criteria) => !criteria.isDisabled);

  const [scores, setScores] = useState<Record<string, ApplicantScoreItem>>({});
  const [rubricType, setRubricType] = useState<RubricType | null>(null);
  const [comment, setComment] = useState<string>("");
  const [metadata, setMetadata] = useState<{
    lastUpdated?: Timestamp;
    lastUpdatedBy?: string;
  }>({});

  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    setScores(focusedApplicant?.score?.scores ?? {});
    setComment(focusedApplicant?.score?.comment ?? "");
    setMetadata({
      lastUpdated: focusedApplicant?.score?.lastUpdated,
      lastUpdatedBy: focusedApplicant?.score?.lastUpdatedBy,
    });
  }, [focusedApplicant]);

  useEffect(() => {
    if (!focusedApplicant) return;
    setRubricType(getExperienceGroup(focusedApplicant));
  }, [focusedApplicant]);

  const handleRubricTypeChange = async (value: RubricType) => {
    if (!focusedApplicant?._id) return;

    const newMetadata = {
      lastUpdated: Timestamp.now(),
      lastUpdatedBy: user?.email ?? "err",
    };

    setRubricType(value);
    setMetadata(newMetadata);

    await updateApplicant(hackathon, focusedApplicant._id, {
      score: {
        rubricType: value,
        ...newMetadata,
      },
    });
  };

  const handleScoreChange = async (field: string, value: number) => {
    if (saving) return;
    if (!focusedApplicant?._id) return;
    setSaving(true);

    const newMetadata = {
      lastUpdated: Timestamp.now(),
      lastUpdatedBy: user?.email ?? "err",
    };

    const newScore = {
      score: value,
      ...newMetadata,
    };

    const updatedScores = scores;

    if (scores[field]?.score === value) {
      delete updatedScores[field];
    } else {
      updatedScores[field] = newScore;
    }

    setScores(updatedScores);
    setMetadata(newMetadata);

    await updateApplicant(hackathon, focusedApplicant?._id, {
      score: {
        scores: {
          [field]: newScore,
        },
        ...newMetadata,
        totalScore: enabledScoringCriteria.reduce((sum, criteria) => {
          const scoreItem = updatedScores[criteria.field];
          const scoreValue = typeof scoreItem?.score === "number" ? scoreItem.score : 0;
          return sum + scoreValue * criteria.weight;
        }, 0),
      },
    });
    setSaving(false);
  };

  const areAllCategoriesScored = () => {
    if (!enabledScoringCriteria.length) return false;
    if (!scores || Object.keys(scores).length === 0) return false;

    return enabledScoringCriteria.every((criteria) => {
      const score = scores[criteria.field];
      return score && typeof score.score === "number";
    });
  };

  const saveComment = useCallback(
    async (comment: string) => {
      if (!focusedApplicant?._id) return;
      if (comment === focusedApplicant?.score?.comment) return; // else this gets triggered on load

      const newMetadata = {
        lastUpdated: Timestamp.now(),
        lastUpdatedBy: user?.email ?? "err",
      };
      await updateApplicant(hackathon, focusedApplicant?._id, {
        score: {
          comment,
          ...newMetadata,
        },
      });
    },
    [hackathon, focusedApplicant, user?.email],
  );

  const { loading: isCommentSaving } = useDebouncedSave(comment, saveComment, 500);

  const saveScoring = async () => {
    if (saving) return;
    if (!focusedApplicant?._id) return;
    setSaving(true);

    if (!isCommentSaving) {
      await saveComment(comment);
    }

    const allCategoriesScored = areAllCategoriesScored();
    const applicationStatus = allCategoriesScored ? "scored" : "gradinginprog";

    const newScore = {
      lastUpdated: Timestamp.now(),
      lastUpdatedBy: user?.email ?? "err",
    };

    await updateApplicant(hackathon, focusedApplicant?._id, {
      score: newScore,
      status: {
        applicationStatus,
      },
    });

    setSaving(false);
  };

  if (!focusedApplicant) {
    return <Card className="sticky top-[2vh] max-h-[96vh]" />;
  }

  return (
    <Card className="sticky top-[2vh] max-h-[96vh] rounded-xl" key={focusedApplicant?._id}>
      <CardHeader>
        <CardTitle>Scoring</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col gap-5 overflow-auto">
        <div className="flex flex-col gap-1.5">
          <Label id="rubric-type">Beginner / Experienced</Label>
          <RadioGroup
            aria-labelledby="rubric-type"
            value={rubricType ?? ""}
            onValueChange={(value) => handleRubricTypeChange(value as RubricType)}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="beginner" id="rubric-type-beginner" />
              <Label htmlFor="rubric-type-beginner" className="font-normal">
                Beginner
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="experienced" id="rubric-type-experienced" />
              <Label htmlFor="rubric-type-experienced" className="font-normal">
                Experienced
              </Label>
            </div>
          </RadioGroup>
        </div>
        {scoringCriteria?.map(
          (criteria) =>
            !criteria.isDisabled && (
              <ScoringItem
                key={criteria.field}
                {...criteria}
                currentScore={scores[criteria.field]}
                onChange={handleScoreChange}
              />
            ),
        )}
        <div className="flex flex-col gap-2 pb-0.5">
          <Label>Comments</Label>
          <Textarea
            placeholder="Comments..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 pb-1">
          <Button onClick={saveScoring}>Save</Button>
          {saving || isCommentSaving ? (
            <div className="text-neutral-500 text-xs">Saving...</div>
          ) : metadata?.lastUpdated || metadata?.lastUpdatedBy ? (
            <div className="text-neutral-500 text-xs">
              Last updated at {metadata?.lastUpdated?.toDate().toLocaleString()} by{" "}
              {metadata?.lastUpdatedBy ?? ""}
            </div>
          ) : (
            <></>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const ScoringItem = ({
  label,
  field,
  currentScore,
  minScore,
  maxScore,
  increments,
  onChange,
}: ScoringCriteria & {
  currentScore?: ApplicantScoreItem;
  onChange?: (field: string, value: number) => void;
}) => {
  const scoreButtons = Array.from(
    { length: Math.floor((maxScore - minScore) / increments) + 1 },
    (_, i) => Math.round((minScore + i * increments) * 100) / 100,
  );
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1">
        {scoreButtons.map((score) => (
          <Button
            key={score}
            variant={currentScore?.score === score ? "default" : "outline"}
            size="icon"
            onClick={() => onChange?.(field, score)}
            className="rounded-full"
          >
            {score}
          </Button>
        ))}
      </div>
      {currentScore !== undefined && (
        <div className="text-neutral-500 text-xs">
          Last updated at {currentScore?.lastUpdated?.toDate().toLocaleString()} by{" "}
          {currentScore?.lastUpdatedBy ?? ""}
        </div>
      )}
    </div>
  );
};
