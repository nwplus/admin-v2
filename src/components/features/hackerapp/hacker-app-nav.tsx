import { CmdFIcon, HackCampIcon, NwHacksIcon } from "@/components/graphy/icono";
import { PageHeader } from "@/components/graphy/typo";
import { Button } from "@/components/ui/button";
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

const ICONS_MAP = {
  nwHacks: NwHacksIcon,
  "cmd-f": CmdFIcon,
  HackCamp: HackCampIcon,
};

const SECTION_NAV = [
  {
    id: "Welcome",
    label: "Welcome",
    icon: Text,
  },
  {
    id: "BasicInfo",
    label: "Basics",
    icon: Clipboard,
  },
  {
    id: "Skills",
    label: "Skills",
    icon: FileUser,
  },
  {
    id: "Questionnaire",
    label: "Questionaire",
    icon: NotepadText,
  },
];

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
              {SECTION_NAV.map((item) => {
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={router.location.hash === item.id}
                      className="transition-all"
                    >
                      <a href={`#${item.id}`}>
                        <IconComponent />
                        {item.label}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button className="transition-all hover:bg-theme/90 hover:text-white active:bg-theme/80 active:text-white">
                    Save all
                  </Button>
                </SidebarMenuButton>
                <div className="p-1 text-neutral-500 text-xs">Last saved</div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
