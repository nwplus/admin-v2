import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "./client";

export const getApplicantResume = async (userId: string) => {
  try {
    const resumeRef = ref(storage, `applicantResumes/${userId}`);
    const url = await getDownloadURL(resumeRef);
    return url;
  } catch (error) {
    console.error("Error getting resume download URL: ", error);
  }
};
