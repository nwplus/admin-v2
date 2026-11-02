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
