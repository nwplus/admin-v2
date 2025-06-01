import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/faq")({
  component: FAQPage,
});

function FAQPage() {
  return <div>Hello "/_auth/faq"!</div>;
}
