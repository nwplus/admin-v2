import { Navigation } from "@/components/layout/Navigation";
import { SignOutButton } from "@/components/sign-out-button";
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
  component: AuthLayout,
});

function AuthLayout() {
  const auth = useAuth();

  return (
    <div className="flex gap-2">
      <div className="h-full">
        <p>Hi {auth?.user?.displayName ?? ""}!</p>

        <Navigation />

        <SignOutButton />
      </div>
      <Outlet />
    </div>
  );
}
