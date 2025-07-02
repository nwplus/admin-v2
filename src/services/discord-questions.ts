import { collection, doc, setDoc, Timestamp, onSnapshot, deleteDoc} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { auth } from "@/lib/firebase/client";
import type { DiscordQuestion } from "@/lib/firebase/types";
import { query } from "firebase/firestore";


const questionsRef = (server:string) => collection(db, "ExternalProjects", "Factotum", "guilds", server, "command-data", "trivia", "questions")
/**
 * Fetches all Discord questions from the database
 */
export const upsertDiscordQuestion = async (values: DiscordQuestion, server: string, questionId?:string) => {
  try {
    const record = {
      lastModified: Timestamp.now(),
      lastModifiedBy: auth.currentUser?.email ?? "",
    }
    const qid = questionId || doc(questionsRef(server)).id;
    await setDoc(doc(db, "ExternalProjects", "Factotum", "guilds", server, "command-data", "trivia", "questions", qid),
                {...values, ...record, id:qid}, {merge:true})
  }
  catch (err) {console.error(err)}
}


//Subscribes to discord question documents 
export const susbcribeToDiscordQuestions = (callback: (docs: DiscordQuestion[]) => void, server: string) => 
   onSnapshot(query(questionsRef(server)), (snap)=> {
    const questions = [];
    for (const doc of snap.docs) {
      questions.push({
        ...(doc.data() as unknown as DiscordQuestion),
        id: doc.id,
      })
    }
    callback(questions)
  })


// //Function for deleting a Discord Question
export const deleteDiscordQuestion = async (server:string, questionId?:string) => {
  if (!questionId) return;
  try {
    await deleteDoc(doc(db, "ExternalProjects", "Factotum", "guilds", server, "command-data", "trivia", "questions", questionId))
  }
  catch (err) {
    console.log(err)
  }
}


