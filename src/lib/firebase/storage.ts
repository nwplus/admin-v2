import type { FirebaseError } from "firebase/app";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import JSZip from "jszip";
import { storage } from "./client";
import type { Applicant } from "./types";

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

/**
 * Uploads a stamp image to storage
 * @param stampId - The stamp document's ID used for naming
 * @param file - The image file
 * @returns a downloadable url of the image just uploaded
 */
export const uploadStampImage = async (stampId: string, file: File) => {
  try {
    const imageRef = ref(storage, `stampImages/${stampId}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  } catch (error) {
    console.error("Error uploading stamp image", stampId, error);
    return null;
  }
};

export const deleteStampImage = async (stampId: string) => {
  try {
    const imageRef = ref(storage, `stampImages/${stampId}`);
    await deleteObject(imageRef);
  } catch (error: unknown) {
    if ((error as FirebaseError)?.code === "storage/object-not-found") return;
    console.error("Error deleting stamp image", stampId, error);
  }
};

/**
 * Uploads a locked stamp image to storage (this is what the user sees before unlocking the stamp)
 * @param stampId - The stamp document's ID used for naming
 * @param file - The image file
 * @returns a downloadable url of the image just uploaded
 */
export const uploadLockedStampImage = async (stampId: string, file: File) => {
  try {
    const imageRef = ref(storage, `stampImages/${stampId}_locked`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  } catch (error) {
    console.error("Error uploading locked stamp image", stampId, error);
    return null;
  }
};

export const deleteLockedStampImage = async (stampId: string) => {
  try {
    const imageRef = ref(storage, `stampImages/${stampId}_locked`);
    await deleteObject(imageRef);
  } catch (error: unknown) {
    if ((error as FirebaseError)?.code === "storage/object-not-found") return;
    console.error("Error deleting locked stamp image", stampId, error);
  }
};

/**
 * Uploads a stamp QR code to storage. 
 * The generated QR code points to the portal, where the logic for unlocking stamps is handled.
 * @param stampId - The stamp document's ID used for naming
 * @param blob - The QR code blob
 * @returns a downloadable url of the QR just uploaded
 */
export const uploadStampQR = async (stampId: string, blob: Blob) => {
  try {
    const qrRef = ref(storage, `stampQRs/${stampId}`);
    await uploadBytes(qrRef, blob);
    return await getDownloadURL(qrRef);
  } catch (error) {
    console.error("Error uploading stamp QR", stampId, error);
    return null;
  }
};

export const deleteStampQR = async (stampId: string) => {
  try {
    const qrRef = ref(storage, `stampQRs/${stampId}`);
    await deleteObject(qrRef);
  } catch (error: unknown) {
    if ((error as FirebaseError)?.code === "storage/object-not-found") return;
    console.error("Error deleting stamp QR", stampId, error);
  }
};

/**
 * Filters applicants who have resumes and agreed to share with sponsors
 * @param applicants - Array of applicant objects
 * @returns Filtered array of applicants
 */
const filterShareableApplicants = (applicants: Applicant[]): Applicant[] => {
  return applicants.filter((applicant) => {
    const hasResume = applicant.skills?.resume && applicant.skills.resume.trim() !== "";
    const shareWithSponsors = applicant.termsAndConditions?.shareWithSponsors;
    return hasResume && shareWithSponsors;
  });
};

/**
 * Extracts and sanitizes applicant names with their IDs
 * @param applicants - Array of applicant objects
 * @returns Array of objects with id and sanitized name
 */
const extractApplicantNamesAndIds = (applicants: Applicant[]) => {
  return applicants.map((applicant) => {
    const firstName =
      applicant.basicInfo?.firstName || applicant.basicInfo?.legalFirstName || "Unknown";
    const lastName = applicant.basicInfo?.lastName || applicant.basicInfo?.legalLastName || "User";
    return {
      id: applicant._id,
      name: `${firstName} ${lastName}`.replace(/[^a-zA-Z0-9\s]/g, ""), // Sanitize filename
    };
  });
};

/**
 * Fetches resume URLs for applicants
 * @param namesAndIds - Array of objects with id and name
 * @returns Promise that resolves to array of objects with id, name, and url
 */
const fetchResumeUrls = async (namesAndIds: { id: string; name: string }[]) => {
  const urlPromises = namesAndIds.map(async (info) => {
    try {
      const url = await getApplicantResume(info.id);
      return { ...info, url };
    } catch (error) {
      console.error(`Failed to get resume URL for ${info.id}:`, error);
      return { ...info, url: null };
    }
  });

  const appUrls = await Promise.all(urlPromises);
  return appUrls.filter((app) => app.url !== null);
};

/**
 * Creates a ZIP file with all valid resume URLs and triggers download
 * @param validUrls - Array of objects with url, name, and id
 * @param hackathonName - Name of the hackathon for the filename
 * @returns Promise that resolves when download is complete
 */
const createAndDownloadResumeZip = async (
  validUrls: { url: string | undefined; name: string; id: string }[],
  hackathonName: string,
): Promise<void> => {
  const zip = new JSZip();

  const zipPromises = validUrls.map(async ({ url, name, id }) => {
    try {
      if (!url) return;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download resume: ${response.statusText}`);
      }

      const resume = await response.blob();
      const extension = "pdf"; // Default to PDF
      zip.file(`${name}_${id}.${extension}`, resume, { binary: true });
    } catch (error) {
      console.error(`Failed to download resume for ${name} (${id}):`, error);
    }
  });

  await Promise.all(zipPromises);
  const finishedZip = await zip.generateAsync({ type: "blob" });

  // Trigger download
  const link = document.createElement("a");
  const url = URL.createObjectURL(finishedZip);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${hackathonName}_resumes_${new Date().toISOString().split("T")[0]}.zip`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Downloads all applicant resumes and packages them in a ZIP file
 * @param applicants - Array of applicant objects
 * @param hackathonName - Name of the hackathon for the ZIP filename
 * @returns Promise that resolves when download is complete
 */
export const getAllApplicantResumes = async (
  applicants: Applicant[],
  hackathonName: string,
): Promise<void> => {
  // Filter applicants who have agreed to share with sponsors and have resumes
  const sharableApps = filterShareableApplicants(applicants);

  if (sharableApps.length === 0) {
    throw new Error("No applicants with resumes found who agreed to share with sponsors");
  }

  // Extract names and IDs
  const namesAndIds = extractApplicantNamesAndIds(sharableApps);

  // Get resume URLs for all applicants
  const validUrls = await fetchResumeUrls(namesAndIds);

  if (validUrls.length === 0) {
    throw new Error("Could not retrieve any resume URLs");
  }

  // Create ZIP file with all resumes and trigger download
  await createAndDownloadResumeZip(validUrls, hackathonName);
};
