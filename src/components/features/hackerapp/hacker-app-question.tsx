import type { HackerApplicationQuestion } from "@/lib/firebase/types";

interface HackerAppQuestionProps {
  question: HackerApplicationQuestion;
}

export function HackerAppQuestion({ question }: HackerAppQuestionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div>{question._id}</div>
      <div>{question.content}</div>
      <div>{question.description}</div>
      <div>{question.title}</div>
      <div>{question.type}</div>
      <div>{question.formInput}</div>
      <div>{question.options}</div>
      <div>{question.other}</div>
    </div>
  );
}
