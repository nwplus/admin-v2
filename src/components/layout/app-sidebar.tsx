import { useAuth } from "@/providers/auth-provider";
import { Link } from "@tanstack/react-router";
import { SignOutButton } from "../features/auth/sign-out-button";
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

const NAVIGATION = [
  {
    content: [
      {
        label: "FAQ",
        href: "/faq",
      },
      {
        label: "Evaluator",
        href: "/evaluator",
      },
      {
        label: "Factotum",
        href: "/factotum",
      },
    ],
  },
  {
    label: "Livesites",
    content: [
      {
        label: "HackCamp",
        href: "/livesites/hackcamp",
      },
      {
        label: "nwHacks",
        href: "/livesites/nwhacks",
      },
      {
        label: "cmd-f",
        href: "/livesites/cmdf",
      },
      {
        label: "www",
        href: "/livesites/www",
      },
    ],
  },
  {
    label: "Hackathons",
    content: [
      {
        label: "HackCamp",
        href: "/hackathons/hackcamp",
      },
      {
        label: "nwHacks",
        href: "/hackathons/nwhacks",
      },
      {
        label: "cmd-f",
        href: "/hackathons/www",
      },
    ],
  },
  {
    label: "Applications",
    content: [
      {
        label: "HackCamp",
        href: "/applications/hackcamp",
      },
      {
        label: "nwHacks",
        href: "/applications/nwhacks",
      },
      {
        label: "cmd-f",
        href: "/applications/cmdf",
      },
    ],
  },
];

export function AppSidebar() {
  const auth = useAuth();

  return (
    <Sidebar variant="sidebar">
      <SidebarHeader>
        <div className="pt-4 pl-2 font-bold text-xl">nwPlus Admin</div>
        <div className="pl-2 text-neutral-500 text-sm">{auth?.user?.displayName ?? ""}</div>
      </SidebarHeader>
      <SidebarContent>
        {NAVIGATION?.map((group) => (
          <SidebarGroup key={group.label ?? "_"}>
            {group?.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group?.content?.map((content) => (
                  <SidebarMenuItem key={content.href}>
                    <SidebarMenuButton asChild>
                      <Link to={content.href}>{content.label}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
