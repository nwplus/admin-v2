import { Link } from "@tanstack/react-router";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "../ui/sidebar";
import type { NavigationGroup } from "./app-sidebar";

export function NavHackathons({
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
              <Collapsible key={content.href} asChild className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
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
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {content.content?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.label}>
                          <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                            <Link to={subItem.href}>{subItem.label}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
