import { CmdFIcon, HackCampIcon, NwHacksIcon } from "@/components/graphy/icono";
import { PageHeader } from "@/components/graphy/typo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRouterState } from "@tanstack/react-router";
import { Clipboard, FileUser, NotepadText, Text } from "lucide-react";
import { SECTIONS } from "./hacker-app-sections";

const ICONS_MAP = {
  nwHacks: NwHacksIcon,
  "cmd-f": CmdFIcon,
  HackCamp: HackCampIcon,
};

const SECTION_ICONS = {
  Welcome: Text,
  BasicInfo: Clipboard,
  Skills: FileUser,
  Questionnaire: NotepadText,
};

export function HackerAppNav({
  hackathonData: [hackathon, year],
}: {
  hackathonData: [string, string | undefined];
}) {
  const HackathonIcon = ICONS_MAP[hackathon as keyof typeof ICONS_MAP] || NwHacksIcon;

  const router = useRouterState();

  return (
    <Sidebar collapsible="none" className="sticky top-4 max-h-[80vh] min-h-[400px] shrink-0 ">
      <SidebarHeader>
        <PageHeader className="flex items-center gap-3">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-card/80 p-[8px] text-background-theme shadow-md backdrop-blur-md">
            <HackathonIcon />
          </div>
          <div className="pl-1">
            <div className="flex-1 truncate text-nowrap font-semibold text-lg leading-5">
              {hackathon} {year ?? ""}
            </div>
            <div className="font-normal text-xs">Hacker application</div>
          </div>
        </PageHeader>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Sections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="font-[500]">
              {SECTIONS.map(({ id, title }) => {
                const IconComponent = SECTION_ICONS[id];
                return (
                  <SidebarMenuItem key={id}>
                    <SidebarMenuButton
                      asChild
                      isActive={router.location.hash === id}
                      className="transition-all"
                    >
                      <a href={`#${id}`}>
                        <IconComponent />
                        {title}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
