import { subscribeToHackathons } from "@/lib/firebase/firestore";
import type { Hackathon } from "@/lib/firebase/types";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bot,
  Calendar,
  DollarSign,
  FileText,
  HelpCircle,
  type LucideIcon,
  Search,
  Star,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CmdFIcon, type CustomIconComponent, HackCampIcon, NwHacksIcon } from "../graphy/icono";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { NavHackathons } from "./nav-hackathons";
import { NavRoot } from "./nav-root";
import { SidebarUser } from "./sidebar-user";

export type NavigationGroup = {
  label?: string;
  href?: string;
  icon?: LucideIcon | CustomIconComponent;
  content?: NavigationGroup[];
};

const NAVIGATION: NavigationGroup[] = [
  {
    content: [
      {
        label: "FAQ",
        href: "/faq",
        icon: HelpCircle,
      },
      {
        label: "Evaluator",
        href: "/evaluator",
        icon: Users,
      },
      {
        label: "Factotum",
        href: "/factotum",
        icon: Bot,
      },
      {
        label: "Query",
        href: "/query",
        icon: Search,
      },
    ],
  },
];

export const generateHackathonNavigation = (hackathons: Hackathon[]) => {
  const hackathonTypes = ["nwHacks", "cmd-f", "HackCamp"];

  const getHackathonIcon = (hackathonId: string): CustomIconComponent => {
    const lowerName = hackathonId.toLowerCase();
    if (lowerName.includes("nwhacks")) return NwHacksIcon;
    if (lowerName.includes("cmd-f")) return CmdFIcon;
    if (lowerName.includes("hackcamp")) return HackCampIcon;
    return NwHacksIcon;
  };

  const latestHackathons = hackathonTypes
    .map(
      (type) =>
        hackathons
          .filter((h) => h._id.toLowerCase().startsWith(type.toLowerCase()))
          .sort((a, b) => {
            const yearA = Number.parseInt(a._id.match(/\d{4}$/)?.[0] || "0");
            const yearB = Number.parseInt(b._id.match(/\d{4}$/)?.[0] || "0");
            return yearB - yearA;
          })[0],
    )
    .filter(Boolean)
    .map((hackathon) => ({
      label: hackathon._id.replace(/\d{4}$/, ""),
      href: `/hackathons/${hackathon._id}`,
      icon: getHackathonIcon(hackathon._id),
      content: [
        {
          label: "Sponsors",
          href: `/hackathons/${hackathon._id}/sponsors`,
          icon: DollarSign,
        },
        {
          label: "Schedule",
          href: `/hackathons/${hackathon._id}/schedule`,
          icon: Calendar,
        },
        {
          label: "Rewards",
          href: `/hackathons/${hackathon._id}/rewards`,
          icon: Star,
        },
        {
          label: "Application",
          href: `/hackathons/${hackathon._id}/application`,
          icon: FileText,
        },
      ],
    }));

  return {
    label: "Hackathons",
    content: latestHackathons,
  } as NavigationGroup;
};

export function AppSidebar() {
  const router = useRouterState();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);

  useEffect(() => {
    const unsubHackathons = subscribeToHackathons((hackathons: Hackathon[]) => {
      setHackathons(hackathons);
    });

    return () => unsubHackathons();
  }, []);

  const dynamicNavigation =
    hackathons?.length > 0 ? [...NAVIGATION, generateHackathonNavigation(hackathons)] : NAVIGATION;

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              asChild
            >
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-theme p-[9px] text-[#5BFFC4]">
                  <NwHacksIcon />
                </div>
                <div className="pl-1">
                  <div className="flex-1 truncate text-nowrap font-semibold text-lg leading-5">
                    nwPlus
                  </div>
                  <div className="text-xs">Admin</div>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <NavRoot pathname={router.location.pathname} group={dynamicNavigation[0]} />
        <NavHackathons pathname={router.location.pathname} group={dynamicNavigation[1]} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
