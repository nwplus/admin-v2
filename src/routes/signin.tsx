import { SignInButton } from "@/components/features/auth/sign-in-button";
import { NwHacksIcon } from "@/components/graphy/icono";
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
        alt="White noise for texturing background"
        className="absolute top-0 left-0 z-0 h-full w-full select-none object-cover"
        draggable={false}
      />
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <div className="relative w-full px-4 md:w-auto">
          <div className="absolute top-0 right-0 h-full w-full">
            <div className="relative h-full w-full">
              <img
                alt="permget"
                src="/nuggets/permget.png"
                draggable={false}
                className="-mt-4 hover:-mt-12 absolute right-5 w-20 select-none transition-all"
              />
            </div>
          </div>
          <Card className="w-full border-[#FFFFFF15] bg-theme/90 shadow-lg backdrop-blur-md md:mx-0 md:w-sm">
            <CardHeader>
              <div className="mb-2 flex aspect-square size-8 items-center justify-center rounded-lg bg-theme p-[9px] text-[#5BFFC4]">
                <NwHacksIcon />
              </div>
              <CardTitle className="text-theme-green">nwPlus Admin</CardTitle>
              <CardDescription className="text-white/80">Welcome back!</CardDescription>
            </CardHeader>
            <CardContent>
              <SignInButton className="border-none bg-gradient-to-br from-theme-green-gradient-light/80 to-theme-green-gradient-dark text-theme" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
