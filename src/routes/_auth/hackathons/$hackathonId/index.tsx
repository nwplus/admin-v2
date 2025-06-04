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
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-theme to-theme-light">
      <img
        src="/noise.svg"
        alt="White noise for texturing background"
        className="absolute top-0 left-0 z-0 h-full w-full select-none object-cover"
        draggable={false}
      />
      <div className="relative z-10 flex select-none flex-col items-center gap-3">
        <div className="slide-in-from-bottom-4 fade-in animate-in font-semibold text-4xl text-foreground-theme/90 duration-700">
          {addSpace(hackathonId ?? "")}
        </div>
        <div className="slide-in-from-bottom-4 fade-in animate-in font-semibold text-foreground-theme/90 text-lg duration-1000">
          nwPlus Admin
        </div>
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
