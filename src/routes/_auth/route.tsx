import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { type AuthContextType, useAuth } from "@/providers/auth-provider";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

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
        <SidebarTrigger className="mt-2 cursor-pointer" />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
