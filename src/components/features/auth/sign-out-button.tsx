import { auth } from "@/lib/firebase/client";
import { useRouter } from "@tanstack/react-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { Button } from "../../ui/button";

export function SignOutButton() {
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

  return (
    <Button
      onClick={handleSignOut}
      disabled={loading}
      className="flex w-full cursor-pointer items-center justify-center"
      variant="outline"
    >
      Sign out
    </Button>
  );
}
