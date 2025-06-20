import { db } from "@/lib/firebase/client";
import type { DevConfig } from "@/lib/firebase/types";
import {
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

/**
 * Utility function that returns DevConfig collection realtime data
 * @param callback - The function used to ingest the data
 * @returns a function to be called on dismount
 */

export const subscribeToDevConfig = (callback: (docs: DevConfig) => void) => {
    return onSnapshot(doc(db, "ExternalProjects", "Factotum", "InitBotInfo", "1254959743705813012"), (querySnapshot) => {
        if (querySnapshot.exists()) {
            const data = {
                ...querySnapshot.data(), _id:querySnapshot.id
            }
            callback(data);
        }
        else {
            console.warn("No Document found")
            
        }
    
 
    });
};

//Function to change a single Dev Config
export const updateDevConfig = async (devConfig: DevConfig, field: string, value: string) => {
    try {
        const docRef = doc(db, "ExternalProjects", "Factotum", "InitBotInfo", devConfig._id );
        await updateDoc(docRef, {
            [field]: value
        })
    }
    catch (error) {
        console.error(error);
        throw error; 
    }
}