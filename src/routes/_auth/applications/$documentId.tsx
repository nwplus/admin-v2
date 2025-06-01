import { createFileRoute } from "@tanstack/react-router";

/**
 * $documentId corresponds to Firestore HackerAppQuestions/[id]
 */
export const Route = createFileRoute("/_auth/applications/$documentId")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_auth/portal/$documentId"!</div>;
}
