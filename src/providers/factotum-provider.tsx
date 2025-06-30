import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { type GeneralConfig, type TicketsConfig, type VerificationConfig } from "@/lib/firebase/types";
import { subscribeToGeneralConfig, subscribeToTicketsConfig, subscribeToVerificationConfig } from "@/services/dev-config";


interface FactotumValue {
  id: string;
  generalConfig?: GeneralConfig;
  ticketsConfig?: TicketsConfig;
  verificationConfig?: VerificationConfig;
}

export const FactotumContext = createContext<FactotumValue | undefined>(undefined);

export function FactotumProvider ({children, id} : { children: ReactNode; id: string }) {
    
    const [generalConfig, setGeneralConfig] = useState<GeneralConfig>()
    const [ticketsConfig, setTicketsConfig] = useState<TicketsConfig>()
    const [verificationConfig, setVerificationConfig] = useState<VerificationConfig>()

    useEffect(() => {
      const unsubGeneral = subscribeToGeneralConfig(setGeneralConfig, id);
      const unsubTickets = subscribeToTicketsConfig(setTicketsConfig, id);
      const unsubVerification = subscribeToVerificationConfig(setVerificationConfig, id);
      
    
      return () => {
        unsubGeneral();
        unsubTickets();
        unsubVerification();
        console.log("all 3 listeners mountd")
      };
    }, [id]);  


    // const value = useMemo(
    //   () => ({
    //     id: id,
    //     generalConfig,
    //     ticketsConfig,
    //     verificationConfig,
    //   }),
    //   [id, generalConfig, ticketsConfig, verificationConfig] 
    // );

    const value = {
      id: id,
      generalConfig,
      ticketsConfig,
      verificationConfig
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


  



