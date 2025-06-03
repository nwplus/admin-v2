"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "@tanstack/react-router";
import { signOut } from "firebase/auth";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { useState } from "react";

export function SidebarUser() {
  const { isMobile } = useSidebar();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);

  const handleSignOut = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
      router.navigate({
        to: "/signin",
      });
    }
  };

  const renderUserInfo = () => (
    <>
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage
          src={user?.photoURL ?? undefined}
          alt={user?.displayName ?? user?.email ?? "User"}
        />
        <AvatarFallback className={cn("rounded-lg", !user?.photoURL ? "border" : "")}>
          {user?.displayName?.substring(0, 1)}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user?.displayName}</span>
        <span className="truncate text-xs">{user?.email}</span>
      </div>
    </>
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {renderUserInfo()}
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align={isMobile ? "start" : "end"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                {renderUserInfo()}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
