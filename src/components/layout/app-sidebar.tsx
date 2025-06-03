import { subscribeToHackathons } from "@/lib/firebase/firestore";
import type { Hackathon } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bot,
  Calendar,
  DollarSign,
  FileText,
  HelpCircle,
  type LucideIcon,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SignOutButton } from "../features/auth/sign-out-button";
import { CmdFIcon, type CustomIconComponent, HackCampIcon, NwHacksIcon } from "../graphy/icono";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";

type NavigationGroup = {
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
  const auth = useAuth();
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
    <Sidebar variant="sidebar">
      <SidebarHeader>
        <div className="pt-4 pl-2 font-bold text-xl">nwPlus Admin</div>
        <div className="pl-2 text-neutral-500 text-sm">{auth?.user?.displayName ?? ""}</div>
      </SidebarHeader>
      <SidebarContent>
        {dynamicNavigation?.map((group) => (
          <SidebarGroup key={group?.label ?? "_"}>
            {group?.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group?.content?.map((content) => {
                  const Icon = content.icon;
                  return (
                    <SidebarMenuItem key={content.href}>
                      <SidebarMenuButton asChild>
                        <Link
                          to={content.href}
                          className={cn(
                            "font-[500] transition-all",
                            router.location.pathname === content.href
                              ? "bg-theme text-white hover:bg-theme/90 hover:text-white active:bg-theme active:text-white"
                              : "hover:bg-theme/10 active:bg-theme/20",
                          )}
                        >
                          {Icon && <Icon className="mr-1 h-4 w-4" />}
                          {content.label}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SignOutButton />
      </SidebarFooter>
    </Sidebar>
  );
}
