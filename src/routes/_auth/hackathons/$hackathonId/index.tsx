import { PageHeader } from "@/components/graphy/typo";
import { createFileRoute, useParams } from "@tanstack/react-router";

/**
 * Corresponds to Firestore Hackathons/[doc id]
 */
export const Route = createFileRoute("/_auth/hackathons/$hackathonId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { hackathonId } = useParams({ from: "/_auth/hackathons/$hackathonId/" });

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <PageHeader>{addSpace(hackathonId ?? "")}</PageHeader>
      </div>
    </div>
  );
}

/**
 * Adds a space between the hackathon name and year LOL
 * @param hackathonId - the hackathon document ID to spacify
 */
const addSpace = (hackathonId: string) => {
  const yearMatch = hackathonId.match(/^(.+?)(\d{4})$/);
  if (yearMatch) {
    const [, hackathon, year] = yearMatch;
    return `${hackathon} ${year}`;
  }
  return hackathonId;
};
