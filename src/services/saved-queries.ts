import { auth, db } from "@/lib/firebase/client";
import type { FirebaseQuery } from "@/lib/firebase/types";
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
  orderBy,
  getDoc,
  getDocs,
} from "firebase/firestore";

/**
 * Collection reference for saved queries
 */
const queriesCollection = () => collection(db, "InternalWebsites", "CMS", "queries");

/**
 * Utility function that returns saved queries collection realtime data
 * @param callback - The function used to ingest the data
 * @returns a function to be called on dismount
 */
export const subscribeToSavedQueries = (callback: (docs: FirebaseQuery[]) => void) =>
  onSnapshot(
    query(
      queriesCollection(),
      orderBy("updatedAt", "desc")
    ),
    (querySnapshot) => {
      const queries: FirebaseQuery[] = [];
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        queries.push({
          ...data,
          id: docSnap.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as FirebaseQuery);
      }
      callback(queries);
    },
    (error) => {
      console.error("Error fetching saved queries:", error);
      callback([]);
    }
  );

/**
 * Utility function that returns public saved queries only
 * @param callback - The function used to ingest the data
 * @returns a function to be called on dismount
 */
export const subscribeToPublicSavedQueries = (callback: (docs: FirebaseQuery[]) => void) =>
  onSnapshot(
    query(
      queriesCollection(),
      where("isPublic", "==", true),
      orderBy("updatedAt", "desc")
    ),
    (querySnapshot) => {
      const queries: FirebaseQuery[] = [];
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        queries.push({
          ...data,
          id: docSnap.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as FirebaseQuery);
      }
      callback(queries);
    },
    (error) => {
      console.error("Error fetching public saved queries:", error);
      callback([]);
    }
  );

/**
 * Utility function that returns saved queries for the current user
 * @param callback - The function used to ingest the data
 * @returns a function to be called on dismount
 */
export const subscribeToUserSavedQueries = (callback: (docs: FirebaseQuery[]) => void) => {
  const currentUserEmail = auth.currentUser?.email;
  if (!currentUserEmail) {
    callback([]);
    return () => {};
  }

  return onSnapshot(
    query(
      queriesCollection(),
      where("createdBy", "==", currentUserEmail),
      orderBy("updatedAt", "desc")
    ),
    (querySnapshot) => {
      const queries: FirebaseQuery[] = [];
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        queries.push({
          ...data,
          id: docSnap.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as FirebaseQuery);
      }
      callback(queries);
    },
    (error) => {
      console.error("Error fetching user saved queries:", error);
      callback([]);
    }
  );
};

/**
 * Get a single saved query by ID
 * @param queryId - The ID of the query to fetch
 * @returns Promise<FirebaseQuery | null>
 */
export const getSavedQuery = async (queryId: string): Promise<FirebaseQuery | null> => {
  try {
    const docSnap = await getDoc(doc(queriesCollection(), queryId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as FirebaseQuery;
    }
    return null;
  } catch (error) {
    console.error("Error fetching saved query:", error);
    throw error;
  }
};

/**
 * Utility function that updates or adds a saved query
 * @param savedQuery - the saved query to update or insert
 * @param id - if updating, ID of the saved query doc to update
 */
export const upsertSavedQuery = async (savedQuery: Omit<FirebaseQuery, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, id?: string) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) {
      throw new Error("User must be authenticated to save queries");
    }

    const now = Timestamp.now();
    const record: {
      updatedAt: Timestamp;
      createdBy: string;
      createdAt?: Timestamp;
    } = {
      updatedAt: now,
      createdBy: currentUser.email,
    };

    const isNewDocument = !id;
    if (isNewDocument) {
      record.createdAt = now;
    }

    const queryId = id || doc(queriesCollection()).id;
    
    const firestoreQuery = {
      ...savedQuery,
      ...record,
    };

    await setDoc(
      doc(queriesCollection(), queryId),
      firestoreQuery,
      { merge: true }
    );

    return queryId;
  } catch (error) {
    console.error("Error saving query:", error);
    throw error;
  }
};

/**
 * Utility function to delete a saved query
 * @param id - the ID of the saved query document to delete
 */
export const deleteSavedQuery = async (id: string) => {
  if (!id) return;
  
  try {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) {
      throw new Error("User must be authenticated to delete queries");
    }

    const queryDoc = await getSavedQuery(id);
    if (queryDoc && queryDoc.createdBy !== currentUser.email) {
      throw new Error("You can only delete your own saved queries");
    }

    await deleteDoc(doc(queriesCollection(), id));
  } catch (error) {
    console.error("Error deleting saved query:", error);
    throw error;
  }
};

/**
 * Utility function to get saved queries by tag
 * @param tag - the tag to filter by
 * @returns Promise<FirebaseQuery[]>
 */
export const getSavedQueriesByTag = async (tag: string): Promise<FirebaseQuery[]> => {
  try {
    const querySnapshot = await getDocs(
      query(
        queriesCollection(),
        where("tags", "array-contains", tag),
        orderBy("updatedAt", "desc")
      )
    );

    const queries: FirebaseQuery[] = [];
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      queries.push({
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as FirebaseQuery);
    }

    return queries;
  } catch (error) {
    console.error("Error fetching saved queries by tag:", error);
    throw error;
  }
};

/**
 * Utility function to duplicate a saved query
 * @param queryId - the ID of the query to duplicate
 * @param newDescription - optional new description for the duplicated query
 * @returns Promise<string> - the ID of the new duplicated query
 */
export const duplicateSavedQuery = async (queryId: string, newDescription?: string): Promise<string> => {
  try {
    const originalQuery = await getSavedQuery(queryId);
    if (!originalQuery) {
      throw new Error("Query not found");
    }

    const { id, createdAt, updatedAt, createdBy, ...queryData } = originalQuery;
    
    const duplicatedQuery = {
      ...queryData,
      description: newDescription || `Copy of ${originalQuery.description}`,
      isPublic: false, 
    };

    return await upsertSavedQuery(duplicatedQuery);
  } catch (error) {
    console.error("Error duplicating saved query:", error);
    throw error;
  }
}; 