import { SignInButton } from "@/components/sign-in-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/signin")({
  component: Signin,
});

function Signin() {
  return (
    <div className="relative h-full w-full bg-background-theme">
      <img
        src="/noise.svg"
        className="absolute top-0 left-0 z-0 h-full w-full select-none object-cover"
        draggable={false}
      />
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <Card className="min-w-xl">
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>We're so glad you're here</CardDescription>
          </CardHeader>
          <CardContent>
            <SignInButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
