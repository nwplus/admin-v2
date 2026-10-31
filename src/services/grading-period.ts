import { auth, db } from "@/lib/firebase/client";
import { Timestamp, doc, onSnapshot, updateDoc } from "firebase/firestore";

/** Per-event control; absent flags preserve the existing evaluator controls. */
export const subscribeToGradingPeriod = (
  hackathonId: string,
  onChange: (enabled: boolean) => void,
  onError: (error: Error) => void,
) =>
  onSnapshot(
    doc(db, "Hackathons", hackathonId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onError(new Error("Hackathon settings not found"));
        return;
      }
      onChange(snapshot.data().featureFlags?.gradingPeriod === true);
    },
    onError,
  );

export const updateGradingPeriod = (hackathonId: string, enabled: boolean) =>
  updateDoc(doc(db, "Hackathons", hackathonId), {
    "featureFlags.gradingPeriod": enabled,
    lastEdited: Timestamp.now(),
    lastEditedBy: auth.currentUser?.email ?? "",
  });
