import { db } from "@/lib/firebase/client";
import type { GeneralConfig, TicketsConfig, VerificationConfig } from "@/lib/firebase/types";
import {
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

import { getDocs, collection } from "firebase/firestore";

export const getGuilds = async () => {
    const querySnapshot = await getDocs(collection(db, "ExternalProjects", "Factotum", "guilds"))
    return querySnapshot.docs.map((doc) => doc.id)
}


export const subscribeToGeneralConfig = (callback: (docs: GeneralConfig) => void, id: string) => {
    return onSnapshot(doc(db, "ExternalProjects", "Factotum", "guilds", id), (snapshot) => {
        if(snapshot.exists()) {
            const data = snapshot.data()
            console.log("listener mounted, data: ", data)
            callback(data)
        }
        else {
            console.warn("No Document found");  
        }
    })
} 

export const subscribeToTicketsConfig = (callback: (docs: TicketsConfig) => void, id: string) => {
    return onSnapshot(doc(db, "ExternalProjects", "Factotum", "guilds", id, "command-data", "tickets"), (snapshot) => {
        if(snapshot.exists()) {
            const data = snapshot.data()
            callback(data)
        }
        else {
            console.warn("No Document found");  
        }
    })
} 

export const subscribeToVerificationConfig = (callback: (docs: VerificationConfig) => void, id: string) => {
    return onSnapshot(doc(db, "ExternalProjects", "Factotum", "guilds", id, "command-data", "verification"), (snapshot) => {
        if(snapshot.exists()) {
            const data = snapshot.data()
            callback(data)
        }
        else {
            console.warn("No Document found");  
        }
    })
} 

export const updateGeneralConfig = async (id: string, path: string, value: string | boolean) => {
    try {
        const docRef = doc(db, "ExternalProjects", "Factotum", "guilds", id);
        await updateDoc(docRef, {
            [path]: value
        })
    }
    catch (error) {
        console.error(error);
        throw error; 
    }
}
export const updateTicketsConfig = async (id: string, path: string, value: string | boolean) => {
    try {
        const docRef = doc(db, "ExternalProjects", "Factotum", "guilds", id, "command-data", "tickets");
        await updateDoc(docRef, {
            [path]: value
        })
    }
    catch (error) {
        console.error(error);
        throw error; 
    }
}
export const updateVerificationConfig = async (id: string, path: string, value: string | boolean) => {
    try {
        const docRef = doc(db, "ExternalProjects", "Factotum", "guilds", id, "command-data", "verification");
        await updateDoc(docRef, {
            [path]: value
        })
    }
    catch (error) {
        console.error(error);
        throw error; 
    }
}

