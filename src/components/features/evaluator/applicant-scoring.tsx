import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedSave } from "@/hooks/use-debounce-save";
import type { ApplicantScoreItem } from "@/lib/firebase/types";
import { useAuth } from "@/providers/auth-provider";
import { useEvaluator } from "@/providers/evaluator-provider";
import { updateApplicant } from "@/services/evaluator";
import { Timestamp } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { SCORING_CRITERIA, type ScoringCriteria } from "./constants";

export function ApplicantScoring() {
  const { user } = useAuth();
  const { hackathon, focusedApplicant } = useEvaluator();

  const [scores, setScores] = useState<Record<string, ApplicantScoreItem>>({});
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
  }, [focusedApplicant?.score]);

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

    setScores((prev) => ({
      ...prev,
      [field]: newScore,
    }));
    setMetadata(newMetadata);

    await updateApplicant(hackathon, focusedApplicant?._id, {
      score: {
        scores: {
          [field]: newScore,
        },
        ...newMetadata,
        totalScore: Object.values(scores).reduce((sum, score) => {
          return sum + (typeof score.score === "number" ? score.score : 0);
        }, 0),
      },
    });
    setSaving(false);
  };

  const markGraded = async () => {
    if (saving) return;
    if (!focusedApplicant?._id) return;
    setSaving(true);

    const newScore = {
      lastUpdated: Timestamp.now(),
      lastUpdatedBy: user?.email ?? "err",
    };
    await updateApplicant(hackathon, focusedApplicant?._id, {
      score: newScore,
      status: {
        applicationStatus: "scored",
      },
    });

    setSaving(false);
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

  if (!focusedApplicant) {
    return <Card className="sticky top-[2vh] max-h-[96vh]" />;
  }

  return (
    <Card className="sticky top-[2vh] max-h-[96vh] rounded-xl" key={focusedApplicant?._id}>
      <CardHeader>
        <CardTitle>Scoring</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col gap-5 overflow-auto">
        {SCORING_CRITERIA?.map((criteria) => (
          <ScoringItem
            key={criteria.field}
            {...criteria}
            currentScore={scores[criteria.field]}
            onChange={handleScoreChange}
          />
        ))}
        <div className="flex flex-col gap-2 pb-0.5">
          <Label>Comments</Label>
          <Textarea
            placeholder="Comments..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 pb-1">
          <Button
            disabled={focusedApplicant?.status?.applicationStatus === "scored"}
            onClick={markGraded}
          >
            {focusedApplicant?.status?.applicationStatus === "scored"
              ? "Marked graded"
              : "Mark as graded"}
          </Button>
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
