import type { FirebaseError } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

export interface GenerateAppleWalletPassesFailure {
  uid: string;
  error: string;
}

export interface GenerateAppleWalletPassesResult {
  generated: number;
  failed: GenerateAppleWalletPassesFailure[];
}

interface GenerateAppleWalletPassesInput {
  dbCollectionName: string;
  uids: string[];
}

export async function generateAppleWalletPasses(
  hackathonId: string,
  uids: string[],
): Promise<GenerateAppleWalletPassesResult> {
  const generate = httpsCallable<GenerateAppleWalletPassesInput, GenerateAppleWalletPassesResult>(
    getFunctions(),
    "generateAppleWalletPasses",
    { timeout: 300000 },
  );

  const result = await generate({ dbCollectionName: hackathonId, uids });
  return result.data;
}

/**
 * Firebase hides server details behind the generic "internal" error. Point admins
 * at the likely missing deployment or signer configuration instead of the raw code.
 */
export function getWalletPassesErrorMessage(error: unknown): string {
  const failure = error as Partial<FirebaseError> | null;
  const code = typeof failure?.code === "string" ? failure.code : undefined;
  const message = typeof failure?.message === "string" ? failure.message : "";

  if (
    code === "not-found" ||
    code === "unavailable" ||
    (code === "internal" && (!message || message === "internal"))
  ) {
    return "Apple pass generation failed. Confirm generateAppleWalletPasses is deployed for this project with its Apple signer secrets, then check the Functions logs.";
  }
  if (message && message !== "internal") return message;
  if (code) return `Apple pass generation failed (${code}).`;
  return "Could not generate Apple passes";
}
