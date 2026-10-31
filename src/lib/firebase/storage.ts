import type { FirebaseError } from "firebase/app";
import { deleteObject, getDownloadURL, getMetadata, ref, uploadBytes } from "firebase/storage";
import JSZip from "jszip";
import { storage } from "./client";
import type { Applicant } from "./types";

export interface ApplicantResumeFile {
  url: string;
  filename: string;
  contentType?: string;
}

const resumeExtensions: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

const safeFilename = (name: string) =>
  Array.from(name, (character) =>
    character.charCodeAt(0) < 32 || /[\\/<>:"|?*]/.test(character) ? "_" : character,
  ).join("");

const resumeFilename = (
  fallback: string,
  metadata: { contentType?: string; contentDisposition?: string; name?: string },
) => {
  const disposition = metadata.contentDisposition ?? "";
  const encoded = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)?.[1];
  const plain = disposition.match(/filename\s*=\s*(?:"([^"]+)"|([^;]+))/i);
  let original = plain?.[1] ?? plain?.[2]?.trim() ?? metadata.name ?? "";
  if (encoded) {
    try {
      original = decodeURIComponent(encoded.trim());
    } catch {
      // A malformed legacy header must not prevent the resume from downloading.
    }
  }
  const extension =
    resumeExtensions[metadata.contentType?.split(";")[0].trim().toLowerCase() ?? ""];
  const safeOriginal = safeFilename(original);
  if (/\.(pdf|docx?|png|jpe?g)$/i.test(safeOriginal)) return safeOriginal;
  return `${safeFilename(fallback)}${extension ? `.${extension}` : ""}`;
};

/** Resolve extensionless legacy objects without depending on the application form field. */
export const getApplicantResumeFile = async (
  userId: string,
): Promise<ApplicantResumeFile | null> => {
  const resumeRef = ref(storage, `applicantResumes/${userId}`);
  try {
    const [url, metadata] = await Promise.all([getDownloadURL(resumeRef), getMetadata(resumeRef)]);
    return {
      url,
      filename: resumeFilename(`resume_${userId}`, metadata),
      contentType: metadata.contentType,
    };
  } catch (error) {
    if ((error as FirebaseError)?.code === "storage/object-not-found") return null;
    throw error;
  }
};

/** Retained for callers that only need the download URL. */
export const getApplicantResume = async (userId: string) =>
  (await getApplicantResumeFile(userId))?.url;

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(url);
  }
};

/** Blob URLs honor filenames even when Storage is on a different origin. */
export const downloadApplicantResume = async (resume: ApplicantResumeFile): Promise<void> => {
  const response = await fetch(resume.url);
  if (!response.ok) throw new Error(`Failed to download resume: ${response.status}`);
  const blob = await response.blob();
  const filename = resumeFilename(resume.filename, {
    contentType: resume.contentType || blob.type,
    name: resume.filename,
  });
  saveBlob(blob, filename);
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

/**
 * Uploads the Hacker Wrapped email banner, replacing any previous one
 * @param hackathonId - The hackathon the banner belongs to
 * @param file - A PNG or JPEG image
 * @returns a downloadable url of the banner just uploaded, or null on failure
 */
export const uploadWrappedBanner = async (hackathonId: string, file: File) => {
  if (file.type !== "image/png" && file.type !== "image/jpeg") {
    console.error("Wrapped banner must be a PNG or JPEG", hackathonId, file.type);
    return null;
  }
  try {
    const imageRef = ref(storage, `wrapped/${hackathonId}/banner`); // we LIKE overwrites
    await uploadBytes(imageRef, file, { contentType: file.type });
    return await getDownloadURL(imageRef);
  } catch (error) {
    console.error("Error uploading Wrapped banner", hackathonId, error);
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
    return applicant.termsAndConditions?.shareWithSponsors === true;
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
 * @returns Available resumes and IDs whose lookup failed
 */
const fetchResumeUrls = async (namesAndIds: { id: string; name: string }[]) => {
  const results = await Promise.allSettled(
    namesAndIds.map(async (info) => {
      const resume = await getApplicantResumeFile(info.id);
      return resume ? { ...info, ...resume } : null;
    }),
  );
  const resumes: (ApplicantResumeFile & { name: string; id: string })[] = [];
  const failed: string[] = [];
  results.forEach((result, index) => {
    if (result.status === "rejected") failed.push(namesAndIds[index].id);
    else if (result.value) resumes.push(result.value);
  });
  return { resumes, failed };
};

/**
 * Creates a ZIP file with all valid resume URLs and triggers download
 * @param validUrls - Array of objects with url, name, and id
 * @param hackathonName - Name of the hackathon for the filename
 * @returns Downloaded count and IDs whose download failed
 */
const createAndDownloadResumeZip = async (
  validUrls: (ApplicantResumeFile & { name: string; id: string })[],
  hackathonName: string,
) => {
  const zip = new JSZip();

  const results = await Promise.allSettled(
    validUrls.map(async ({ url, name, id, filename, contentType }) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to download resume: ${response.status}`);
      const resume = await response.blob();
      const resolvedName = resumeFilename(filename, {
        name: filename,
        contentType: contentType || resume.type,
      });
      const extension = resolvedName.match(/\.(pdf|docx?|png|jpe?g)$/i)?.[1];
      zip.file(`${safeFilename(`${name}_${id}`)}${extension ? `.${extension}` : ""}`, resume, {
        binary: true,
      });
    }),
  );
  const failed = validUrls
    .filter((_, index) => results[index].status === "rejected")
    .map(({ id }) => id);
  const downloaded = validUrls.length - failed.length;
  if (!downloaded) throw new Error("Could not download any resumes");
  const finishedZip = await zip.generateAsync({ type: "blob" });
  saveBlob(
    finishedZip,
    `${safeFilename(hackathonName)}_resumes_${new Date().toISOString().split("T")[0]}.zip`,
  );
  return { downloaded, failed };
};

/**
 * Downloads all applicant resumes and packages them in a ZIP file
 * @param applicants - Array of applicant objects
 * @param hackathonName - Name of the hackathon for the ZIP filename
 * @returns Downloaded count and failed IDs; rejects if no resumes can be downloaded
 */
export const getAllApplicantResumes = async (applicants: Applicant[], hackathonName: string) => {
  // Filter applicants who have agreed to share with sponsors and have resumes
  const sharableApps = filterShareableApplicants(applicants);

  if (sharableApps.length === 0) {
    throw new Error("No applicants with resumes found who agreed to share with sponsors");
  }

  // Extract names and IDs
  const namesAndIds = extractApplicantNamesAndIds(sharableApps);

  // Get resume URLs for all applicants
  const { resumes: validUrls, failed } = await fetchResumeUrls(namesAndIds);

  if (validUrls.length === 0) {
    throw new Error("Could not retrieve any resume URLs");
  }

  // Create ZIP file with all resumes and trigger download
  const result = await createAndDownloadResumeZip(validUrls, hackathonName);
  return { downloaded: result.downloaded, failed: [...failed, ...result.failed] };
};
