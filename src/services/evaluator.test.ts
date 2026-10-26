import { deleteField, setDoc } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateApplicant } from "./evaluator";

vi.mock("@/lib/firebase/client", () => ({ db: {} }));
vi.mock("@/services/query", () => ({ flattenApplicantData: vi.fn() }));
vi.mock("firebase/firestore", async (importOriginal) => {
  const original = await importOriginal<typeof import("firebase/firestore")>();
  return { ...original, doc: vi.fn(() => "applicant-ref"), setDoc: vi.fn() };
});

beforeEach(() => vi.clearAllMocks());

describe("updateApplicant", () => {
  it("passes an explicit field deletion through a merged Firestore write", async () => {
    const patch = { score: { scores: { question: deleteField() }, totalScore: 4 } };
    await updateApplicant("hackcamp", "fixture", patch);
    expect(setDoc).toHaveBeenCalledWith("applicant-ref", patch, { merge: true });
  });

  it("rejects when Firestore fails so the caller can recover", async () => {
    const failure = new Error("permission denied");
    vi.mocked(setDoc).mockRejectedValueOnce(failure);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(
        updateApplicant("hackcamp", "fixture", { score: { totalScore: 0 } }),
      ).rejects.toBe(failure);
    } finally {
      consoleError.mockRestore();
    }
  });
});
