import type { GeneralConfig, TicketsConfig, VerificationConfig } from "@/lib/firebase/types";
import {
  subscribeToGeneralConfig,
  subscribeToTicketsConfig,
  subscribeToVerificationConfig,
} from "@/services/factotum";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

interface FactotumValue {
  server: string;
  generalConfig?: GeneralConfig;
  ticketsConfig?: TicketsConfig;
  verificationConfig?: VerificationConfig;
}

export const FactotumContext = createContext<FactotumValue | undefined>(undefined);

export function FactotumProvider({ children, server }: { children: ReactNode; server: string }) {
  const [generalConfig, setGeneralConfig] = useState<GeneralConfig>();
  const [ticketsConfig, setTicketsConfig] = useState<TicketsConfig>();
  const [verificationConfig, setVerificationConfig] = useState<VerificationConfig>();

  useEffect(() => {
    const unsubGeneral = subscribeToGeneralConfig(setGeneralConfig, server);
    const unsubTickets = subscribeToTicketsConfig(setTicketsConfig, server);
    const unsubVerification = subscribeToVerificationConfig(setVerificationConfig, server);

    return () => {
      unsubGeneral();
      unsubTickets();
      unsubVerification();
    };
  }, [server]);

  const value = useMemo(
    () => ({
      server: server,
      generalConfig,
      ticketsConfig,
      verificationConfig,
    }),
    [server, generalConfig, ticketsConfig, verificationConfig],
  );

  return <FactotumContext.Provider value={value}>{children}</FactotumContext.Provider>;
}

export function useFactotum() {
  const context = useContext(FactotumContext);
  if (context === undefined) {
    throw new Error("useFactotum must be used within a FactotumProvider");
  }
  return context;
}
