import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Response } from "./response";

const mocks = vi.hoisted(() => ({ lookup: vi.fn(), download: vi.fn() }));
vi.mock("@/lib/firebase/storage", () => ({
  getApplicantResume: mocks.lookup,
  getApplicantResumeFile: mocks.lookup,
  downloadApplicantResume: mocks.download,
}));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }));
const file = (url: string) => ({ url, filename: "resume.pdf", contentType: "application/pdf" });

afterEach(cleanup);
beforeEach(() => vi.resetAllMocks());

describe("resume response", () => {
  it("finds stored resumes when the application field is missing", async () => {
    mocks.lookup.mockResolvedValue(file("https://example.invalid/resume"));
    render(<Response type="resume" userId="synthetic-id" />);
    await waitFor(() => expect(mocks.lookup).toHaveBeenCalledWith("synthetic-id"));
    expect((await screen.findByRole("link", { name: /View resume/ })).getAttribute("href")).toBe(
      "https://example.invalid/resume",
    );
  });

  it("waits for storage rather than showing an unverified filename as a link", async () => {
    mocks.lookup.mockReturnValue(new Promise(() => {}));
    render(<Response type="resume" userId="synthetic-id" response="encoded%20resume.docx" />);
    expect(screen.queryByRole("link", { name: /View resume/ })).toBeNull();
    expect(screen.queryByText("Uploaded")).toBeNull();
  });

  it("does not replace a new applicant's resume with an older request", async () => {
    let resolveOld!: (value: ReturnType<typeof file>) => void;
    mocks.lookup.mockImplementation((id: string) =>
      id === "old"
        ? new Promise((resolve) => {
            resolveOld = resolve;
          })
        : Promise.resolve(file("https://example.invalid/new")),
    );
    const { rerender } = render(<Response type="resume" userId="old" response="old.pdf" />);
    rerender(<Response type="resume" userId="new" response="new.pdf" />);
    await screen.findByRole("link", { name: /View resume/ });
    await act(async () => resolveOld(file("https://example.invalid/old")));
    expect(screen.getByRole("link", { name: /View resume/ }).getAttribute("href")).toBe(
      "https://example.invalid/new",
    );
  });

  it("uses a legacy HTTP URL when no storage object is found", async () => {
    mocks.lookup.mockResolvedValue(null);
    render(
      <Response
        type="resume"
        userId="synthetic-id"
        response="https://example.invalid/legacy.pdf"
      />,
    );
    expect((await screen.findByRole("link", { name: /View resume/ })).getAttribute("href")).toBe(
      "https://example.invalid/legacy.pdf",
    );
  });

  it("does not make arbitrary filenames or unsafe schemes into links", async () => {
    mocks.lookup.mockResolvedValue(null);
    render(<Response type="resume" userId="synthetic-id" response="javascript:alert(1)" />);
    await waitFor(() => expect(screen.getByPlaceholderText("No response")).toBeTruthy());
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("keeps a legacy Word extension when metadata lookup fails", async () => {
    mocks.lookup.mockRejectedValue(new Error("permission denied"));
    render(
      <Response
        type="resume"
        userId="synthetic-id"
        response="https://example.invalid/legacy.docx?token=test"
      />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Download resume" }));
    await waitFor(() =>
      expect(mocks.download).toHaveBeenCalledWith({
        url: "https://example.invalid/legacy.docx?token=test",
        filename: "resume.docx",
      }),
    );
  });

  it("keeps a direct legacy Word link when browser download requests are blocked", async () => {
    mocks.lookup.mockResolvedValue(null);
    mocks.download.mockRejectedValue(new TypeError("Failed to fetch"));
    render(
      <Response
        type="resume"
        userId="synthetic-id"
        response="https://external.invalid/resume.docx"
      />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Download resume" }));
    await waitFor(() => expect(mocks.download).toHaveBeenCalled());
    expect(screen.getByRole("link", { name: "Open original resume" }).getAttribute("href")).toBe(
      "https://external.invalid/resume.docx",
    );
    expect(screen.getByRole("button", { name: "Download resume" }).hasAttribute("disabled")).toBe(
      false,
    );
  });

  it.each(["png", "jpg", "jpeg"])("preserves a legacy .%s resume extension", async (extension) => {
    mocks.lookup.mockResolvedValue(null);
    render(
      <Response
        type="resume"
        userId="synthetic-id"
        response={`https://example.invalid/legacy.${extension}`}
      />,
    );
    expect(await screen.findByRole("link", { name: /View resume/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Download resume" }));
    await waitFor(() =>
      expect(mocks.download).toHaveBeenCalledWith({
        url: `https://example.invalid/legacy.${extension}`,
        filename: `resume.${extension}`,
      }),
    );
  });

  it("shows a lookup error separately from a missing upload", async () => {
    mocks.lookup.mockRejectedValue(new Error("permission denied"));
    render(<Response type="resume" userId="synthetic-id" />);
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Unable to load resume.",
    );
  });

  it("downloads Word resumes with the resolved filename", async () => {
    const resume = {
      url: "https://example.invalid/word",
      filename: "resume.docx",
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    mocks.lookup.mockResolvedValue(resume);
    mocks.download.mockResolvedValue(undefined);
    render(<Response type="resume" userId="synthetic-id" response="resume.docx" />);
    fireEvent.click(await screen.findByRole("button", { name: "Download resume" }));
    await waitFor(() => expect(mocks.download).toHaveBeenCalledWith(resume));
  });
});
