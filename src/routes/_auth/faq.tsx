import { FAQDialog } from "@/components/features/faq/faq-dialog";
import { QuestionsTable } from "@/components/features/faq/questions-table";
import { PageHeader } from "@/components/graphy/typo";
import { Button } from "@/components/ui/button";
import { subscribeToFAQ, subscribeToHackathons } from "@/lib/firebase/firestore";
import type { FAQ, Hackathon } from "@/lib/firebase/types";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_auth/faq")({
  component: FAQPage,
});

function FAQPage() {
  const [questions, setQuestions] = useState<FAQ[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);

  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubQuestions = subscribeToFAQ((questions: FAQ[]) => {
      setQuestions(questions);
    });
    const unsubHackathons = subscribeToHackathons((hackathons: Hackathon[]) => {
      setHackathons(hackathons);
    });

    return () => {
      unsubQuestions();
      unsubHackathons();
    };
  }, []);

  return (
    <>
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <PageHeader>FAQ</PageHeader>
          <Button onClick={() => setOpen(true)}>
            <Plus />
            New Question
          </Button>
        </div>
        <QuestionsTable questions={questions ?? []} hackathons={hackathons} />
      </div>
      <FAQDialog open={open} onClose={() => setOpen(false)} hackathons={hackathons} />
    </>
  );
}
