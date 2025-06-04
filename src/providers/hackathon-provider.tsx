import { type ReactNode, createContext, useContext } from "react";

export interface HackathonContextType {
  activeHackathon: string;
}

export const HackathonContext = createContext<HackathonContextType | null>(null);

const HackathonProvider = ({
  activeHackathon,
  children,
}: { activeHackathon: string; children: ReactNode }) => {
  const value = {
    activeHackathon,
  };

  return <HackathonContext.Provider value={value}>{children}</HackathonContext.Provider>;
};

export const useHackathon = () => {
  const context = useContext(HackathonContext);
  if (!context) {
    throw new Error("useHackathon must be used within an HackathonContext");
  }
  return context;
};

export default HackathonProvider;
