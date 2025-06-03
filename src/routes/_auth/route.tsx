import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AuthContextType } from "@/providers/auth-provider";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { Command } from "lucide-react";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context, location }) => {
    if (!(context as { auth: AuthContextType }).auth.isAuthenticated) {
      throw redirect({
        to: "/signin",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AuthorizedLayout,
});

function AuthorizedLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex w-full flex-col gap-2 px-4 pb-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger className="mt-2 cursor-pointer" />
          </TooltipTrigger>
          <TooltipContent side="right">
            <div className="flex items-center">
              <Command className="h-4 w-4" /> + b
            </div>
          </TooltipContent>
        </Tooltip>
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
