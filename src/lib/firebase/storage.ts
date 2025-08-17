import type { FirebaseError } from "firebase/app";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./client";

/**
 * Utility function to return a downloadable url of a user
 * @param userId - the ID of the applicant of the resume
 * @returns a url string
 */
export const getApplicantResume = async (userId: string) => {
  try {
    const resumeRef = ref(storage, `applicantResumes/${userId}`);
    const url = await getDownloadURL(resumeRef);
    return url;
  } catch (error) {
    console.error("Error getting resume download URL: ", error);
  }
};

/**
 *
 * @param hackathon - The hackathon for which the sponsor belongs to
 * @param sponsorId - The sponsor document's ID used for naming
 * @param file - The image file
 * @returns a downloadable url of the image just uploaded
 */
export const uploadSponsorImage = async (hackathon: string, sponsorId: string, file: File) => {
  try {
    const imageRef = ref(storage, `sponsor/${hackathon}/${sponsorId}`); // we LIKE overwrites
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  } catch (error) {
    console.error("Error uploading image", hackathon, sponsorId, error);
    return null;
  }
};

export const deleteSponsorImage = async (hackathon: string, sponsorId: string) => {
  try {
    const imageRef = ref(storage, `sponsor/${hackathon}/${sponsorId}`);
    await deleteObject(imageRef);
  } catch (error: unknown) {
    if ((error as FirebaseError)?.code === "storage/object-not-found") return;
    console.error("Error deleting image", hackathon, sponsorId, error);
  }
};

/**
 *
 * @param hackathon - The hackathon for which the reward belongs to
 * @param rewardId - The reward document's ID used for naming
 * @param file - The image file
 * @returns a downloadable url of the image just uploaded
 */
export const uploadRewardImage = async (hackathon: string, rewardId: string, file: File) => {
  try {
    const imageRef = ref(storage, `reward/${hackathon}/${rewardId}`); // we LIKE overwrites
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  } catch (error) {
    console.error("Error uploading image", hackathon, rewardId, error);
    return null;
  }
};

export const deleteRewardImage = async (hackathon: string, rewardId: string) => {
  try {
    const imageRef = ref(storage, `reward/${hackathon}/${rewardId}`);
    await deleteObject(imageRef);
  } catch (error: unknown) {
    if ((error as FirebaseError)?.code === "storage/object-not-found") return;
    console.error("Error deleting image", hackathon, rewardId, error);
  }
};
