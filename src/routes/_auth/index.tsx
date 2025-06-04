import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/")({
  component: App,
});

const ALL_NUGGETS = {
  bugget: "Badminton Nugget",
  devget: "Dev Nugget",
  granuget: "'Granola Gals'",
  bowlget: "Byron",
  merchget: "2023 Nugget",
  noodget: "Indomie Nugget",
  permget: "Perm Nugget",
  sadget: "sad",
  ultget: "JOIN ULTI!",
  veebget: "nwVeebs",
  zipget: "2024 Nugget",
  furryget: "Alan",
  strawbnugg: "strawb nugg",
  sleepyget: "sleepy",
  kermitget: "Kermit",
};

function App() {
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
          Welcome back!
        </div>
        <div className="slide-in-from-bottom-4 fade-in animate-in font-semibold text-foreground-theme/90 text-lg duration-1000">
          nwPlus Admin
        </div>
        {/* I would put randomized nwQuotes without context here but because this is client-side we can't risk it getting public */}
      </div>
      <div className="absolute bottom-5 left-0 flex w-full justify-center gap-8">
        {/* leaving room for Jesus */}
        {Object.entries(ALL_NUGGETS)?.map(([name, lore]) => (
          <Tooltip key={name}>
            <TooltipTrigger>
              <img
                alt={name}
                src={`/nuggets/${name}.png`}
                className="hover:-translate-y-2 w-30 select-none opacity-80 transition-all hover:opacity-100"
                draggable={false}
              />
            </TooltipTrigger>
            <TooltipContent className="bg-foreground-theme">{lore}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
