import { Link } from "@tanstack/react-router";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import type { NavigationGroup } from "./app-sidebar";

export function NavRoot({
  group,
  pathname,
}: {
  group: NavigationGroup;
  pathname: string;
}) {
  const { state } = useSidebar();

  return (
    <SidebarGroup key={group?.label ?? "_"}>
      {group?.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {group?.content?.map((content) => {
            const Icon = content.icon;
            return (
              <SidebarMenuItem key={content.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === content.href}
                  tooltip={{
                    children: content.label,
                    hidden: state === "expanded",
                  }}
                >
                  <Link
                    to={content.href}
                    className="font-[500] transition-all hover:bg-theme/10 active:bg-theme/20"
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
  );
}
