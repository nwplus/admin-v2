import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { subscribeToDevConfig } from "@/services/dev-config";
import DevConfig from "@/components/features/factotum/dev-config";


export interface DevConfig {
    _id: string;
    channelIDs?: {
      adminConsole?: string;
      adminLog?: string;
    }
    embedColor?: string;
    hackathonName?: string;
    isSetUpComplete?: boolean;
    roleIDs?: {
      adminRole?: string;
      everyoneRole?: string;
      memberRole?: string;
      mentorRole?: string;
      staffRole?: string;
    }
    verification?: {
      guestRoleID?: string;
      isEnabled?: boolean;
      roles?: [
        {
          name: string;
          roleId: string;
        },
        {
          name: string;
          roleId: string;
        },
        {
          name: string;
          roleId: string;
        },
        {
          name: string;
          roleId: string;
        },
        {
          name: string;
          roleId: string;
        }
      ]
      welcomeSupportChannel?: string;
    }
  }



  export const FactotumContext = createContext<DevConfig | undefined>(undefined);

  export function FactotumProvider ({children} : { children: ReactNode }) {
    
    const [devConfig, setDevConfig] = useState<DevConfig>();

    useEffect(() => {
        const unsub = subscribeToDevConfig((devConfig: DevConfig) => {
            setDevConfig(devConfig);
        });
        return () => unsub();
    }, []);



    return (
        <FactotumContext.Provider value = {devConfig}>
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


  



