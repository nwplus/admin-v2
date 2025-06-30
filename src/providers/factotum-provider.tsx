import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { type DevConfig, type GeneralConfig, type TicketsConfig, type VerificationConfig } from "@/lib/firebase/types";
import { subscribeToGeneralConfig, subscribeToTicketsConfig, subscribeToVerificationConfig } from "@/services/dev-config";


export const FactotumContext = createContext<DevConfig | undefined>(undefined);

export function FactotumProvider ({children, id} : { children: ReactNode; id: string }) {
    
    const [generalConfig, setGeneralConfig] = useState<GeneralConfig>()
    const [ticketsConfig, setTicketsConfig] = useState<TicketsConfig>()
    const [verificationConfig, setVerificationConfig] = useState<VerificationConfig>()

    useEffect(() => {
        const unsub = () => {
          subscribeToGeneralConfig((generalConfig: GeneralConfig) => {
          setGeneralConfig(generalConfig);
        }, id);

        subscribeToTicketsConfig((ticketsConfig: TicketsConfig) => {
          setTicketsConfig(ticketsConfig);
        }, id);

        subscribeToVerificationConfig((verificationConfig: VerificationConfig) => {
          setVerificationConfig(verificationConfig);
        }, id);
      }
        return () => unsub();
    }, []);

    const value = {
      id: id,
      GeneralConfig: generalConfig, 
      VerificationConfig: verificationConfig,
      TicketsConfig: ticketsConfig
    }

    return (
        <FactotumContext.Provider value = {value}>
            {children}
        </FactotumContext.Provider>
    )
  }

  export function useFactotum() {
    const context = useContext(FactotumContext);
    if (context === undefined) {
      throw new Error("useFactotum must be used within a FactotumProvider");
    }
    return context;
  } 


  



