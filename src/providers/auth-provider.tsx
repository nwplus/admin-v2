import { Loading } from "@/components/ui/loading";
import { checkAdminClaim } from "@/lib/firebase/auth";
import { auth } from "@/lib/firebase/client";
import type { User } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { type ReactNode, createContext, useContext, useEffect, useState } from "react";

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const setAdmin = httpsCallable<void, { isAdmin: boolean }>(getFunctions(), "setAdmin");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      // User has logged out
      if (!currentUser) {
        setUser(null);
      } else {
        // User logged in
        const isAdmin = await checkAdminClaim(currentUser);
        if (!isAdmin) {
          // User does not have requisite permissions
          const result = await setAdmin();
          if (result.data.isAdmin) {
            await currentUser.getIdToken(true);
            setUser(currentUser);
          } else {
            setUser(null);
          }
        } else {
          // User is authorized
          setUser(currentUser);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setAdmin]);

  const value = {
    isAuthenticated: !!user,
    user,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? <Loading isFullScreen /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
