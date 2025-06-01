import { checkAdminClaim } from "@/lib/firebase/auth";
import { auth } from "@/lib/firebase/client";
import type { User } from "firebase/auth";
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
          setUser(null);
        } else {
          // User is authorized
          setUser(currentUser);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    isAuthenticated: !!user,
    user,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? <div>Loading</div> : children}
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
