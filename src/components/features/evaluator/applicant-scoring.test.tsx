import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Timestamp, deleteField } from "firebase/firestore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicantScoring } from "./applicant-scoring";

const mocks = vi.hoisted(() => ({
  updateApplicant: vi.fn(),
  context: {} as Record<string, unknown>,
  error: vi.fn(),
}));
vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ user: { email: "grader@example.org" } }),
}));
vi.mock("@/providers/evaluator-provider", () => ({ useEvaluator: () => mocks.context }));
vi.mock("@/hooks/use-debounce-save", () => ({ useDebouncedSave: () => ({ loading: false }) }));
vi.mock("@/services/evaluator", () => ({
  updateApplicant: mocks.updateApplicant,
  saveDefaultRubricType: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { error: mocks.error } }));

const metadata = { lastUpdated: Timestamp.fromMillis(1), lastUpdatedBy: "original@example.org" };
const fixture = () => ({
  _id: "applicant-a",
  score: {
    rubricType: "beginner",
    scores: { question: { score: 0, ...metadata }, sibling: { score: 2, ...metadata } },
  },
});
const criteria = [
  { field: "question", label: "Question", minScore: 0, maxScore: 1, increments: 1, weight: 3 },
  { field: "sibling", label: "Sibling", minScore: 2, maxScore: 2, increments: 1, weight: 2 },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.updateApplicant.mockResolvedValue(undefined);
  mocks.context = { hackathon: "hackcamp", focusedApplicant: fixture(), scoringCriteria: criteria };
});
afterEach(cleanup);

describe("score persistence", () => {
  it("rolls a failed rubric write back to the last successful selection", async () => {
    render(<ApplicantScoring />);
    fireEvent.click(screen.getByRole("radio", { name: "Experienced" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(false),
    );
    mocks.updateApplicant.mockRejectedValueOnce(new Error("offline"));
    fireEvent.click(screen.getByRole("radio", { name: "Beginner" }));
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith("Failed to save rubric. Please try again."),
    );
    expect(screen.getByRole("radio", { name: "Experienced" }).getAttribute("aria-checked")).toBe(
      "true",
    );
  });

  it("saves a comment reverted to its original text after a successful edit", async () => {
    render(<ApplicantScoring />);
    fireEvent.change(screen.getByPlaceholderText("Comments..."), { target: { value: "Edited" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(false),
    );
    fireEvent.change(screen.getByPlaceholderText("Comments..."), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mocks.updateApplicant).toHaveBeenCalledWith(
        "hackcamp",
        "applicant-a",
        expect.objectContaining({ score: expect.objectContaining({ comment: "" }) }),
      ),
    );
  });

  it("deletes a selected zero score without mutating the applicant or sibling", async () => {
    const original = fixture();
    mocks.context.focusedApplicant = original;
    render(<ApplicantScoring />);
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    await waitFor(() => expect(mocks.updateApplicant).toHaveBeenCalled());
    const patch = mocks.updateApplicant.mock.calls[0][2];
    expect(patch.score.scores.question).toEqual(deleteField());
    expect(patch.score.totalScore).toBe(4);
    expect(Object.keys(patch.score.scores)).toEqual(["question"]);
    expect(original.score.scores.question.score).toBe(0);
    expect(original.score.scores.sibling.score).toBe(2);
  });

  it("persists a selected score with its weighted total and grader metadata", async () => {
    render(<ApplicantScoring />);
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    await waitFor(() => expect(mocks.updateApplicant).toHaveBeenCalled());
    expect(mocks.updateApplicant.mock.calls[0][2].score).toMatchObject({
      scores: { question: { score: 1, lastUpdatedBy: "grader@example.org" } },
      totalScore: 7,
    });
  });

  it("restores the score after a rejected write and permits retry", async () => {
    mocks.updateApplicant.mockRejectedValueOnce(new Error("offline"));
    render(<ApplicantScoring />);
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    await waitFor(() => expect(mocks.updateApplicant).toHaveBeenCalledTimes(2));
    expect(mocks.updateApplicant.mock.calls[1][2].score.scores.question.score).toBe(1);
  });

  it("marks a deselected application incomplete when saved", async () => {
    render(<ApplicantScoring />);
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(false),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mocks.updateApplicant).toHaveBeenCalledWith(
        "hackcamp",
        "applicant-a",
        expect.objectContaining({ status: { applicationStatus: "gradinginprog" } }),
      ),
    );
  });

  it("recovers after a failed grading-status save", async () => {
    mocks.updateApplicant.mockImplementation(async (_hackathon, _id, patch) => {
      if (patch.status) throw new Error("offline");
    });
    render(<ApplicantScoring />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith("Failed to save grading status. Please try again."),
    );
    expect(screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(false);
    mocks.updateApplicant.mockResolvedValue(undefined);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mocks.updateApplicant.mock.calls.filter((call) => call[2].status)).toHaveLength(2),
    );
  });

  it("keeps a newly focused applicant intact when the previous save fails", async () => {
    let rejectSave: (error: Error) => void = () => {};
    mocks.updateApplicant.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectSave = reject;
      }),
    );
    const view = render(<ApplicantScoring />);
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    mocks.context.focusedApplicant = { ...fixture(), _id: "applicant-b" };
    view.rerender(<ApplicantScoring />);
    rejectSave(new Error("offline"));
    await waitFor(() => expect(mocks.error).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    await waitFor(() => expect(mocks.updateApplicant).toHaveBeenCalledTimes(2));
    expect(mocks.updateApplicant.mock.calls[1][1]).toBe("applicant-b");
    expect(mocks.updateApplicant.mock.calls[1][2].score.scores.question).toEqual(deleteField());
  });
});
