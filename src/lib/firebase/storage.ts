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
 * Downloads all applicant resumes and packages them in a ZIP file
 * @param applicants - Array of applicant objects
 * @param hackathonName - Name of the hackathon for the ZIP filename
 * @returns Promise that resolves when download is complete
 */
export const getAllResumes = async (
  applicants: Applicant[],
  hackathonName: string,
): Promise<void> => {
  // Filter applicants who have agreed to share with sponsors and have resumes
  const sharableApps = applicants.filter((applicant) => {
    const hasResume = applicant.skills?.resume && applicant.skills.resume.trim() !== "";
    const shareWithSponsors = applicant.termsAndConditions?.shareWithSponsors;
    return hasResume && shareWithSponsors;
  });

  if (sharableApps.length === 0) {
    throw new Error("No applicants with resumes found who agreed to share with sponsors");
  }

  // Extract names and IDs
  const namesAndIds = sharableApps.map((applicant) => {
    const firstName =
      applicant.basicInfo?.firstName || applicant.basicInfo?.legalFirstName || "Unknown";
    const lastName = applicant.basicInfo?.lastName || applicant.basicInfo?.legalLastName || "User";
    return {
      id: applicant._id,
      name: `${firstName} ${lastName}`.replace(/[^a-zA-Z0-9\s]/g, ""), // Sanitize filename
    };
  });

  // Get resume URLs for all applicants
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

  // Filter out applicants where we couldn't get URLs
  const validUrls = appUrls.filter((app) => app.url !== null);

  if (validUrls.length === 0) {
    throw new Error("Could not retrieve any resume URLs");
  }

  const zip = new JSZip();

  // Download and add resumes to ZIP
  const zipPromises = validUrls.map(async ({ url, name, id }) => {
    try {
      if (!url) return;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download resume: ${response.statusText}`);
      }

      const resume = await response.blob();

      // Try to determine file extension from the URL or Content-Type
      let extension = "pdf"; // Default to PDF
      const contentType = response.headers.get("content-type");
      const urlPath = url.split("?")[0]; // Remove query parameters
      const urlExtension = urlPath.split(".").pop()?.toLowerCase();

      if (urlExtension && ["pdf", "doc", "docx"].includes(urlExtension)) {
        extension = urlExtension;
      } else if (contentType?.includes("pdf")) {
        extension = "pdf";
      } else if (contentType?.includes("word")) {
        extension = "docx";
      }

      zip.file(`${name}_${id}.${extension}`, resume, { binary: true });
    } catch (error) {
      console.error(`Failed to download resume for ${name} (${id}):`, error);
    }
  });

  await Promise.all(zipPromises);

  // Generate and trigger download
  const finishedZip = await zip.generateAsync({ type: "blob" });

  // Create download link
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

  // Clean up the object URL
  URL.revokeObjectURL(url);
};
