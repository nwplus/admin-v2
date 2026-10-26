import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadApplicantResume, getAllApplicantResumes, getApplicantResumeFile } from "./storage";
import type { Applicant } from "./types";

const mocks = vi.hoisted(() => ({
  metadata: vi.fn(),
  url: vi.fn(),
  zipFile: vi.fn(),
  zipGenerate: vi.fn(),
}));
vi.mock("./client", () => ({ storage: {} }));
vi.mock("firebase/storage", () => ({
  ref: (_storage: unknown, path: string) => ({ fullPath: path }),
  getDownloadURL: mocks.url,
  getMetadata: mocks.metadata,
  deleteObject: vi.fn(),
  uploadBytes: vi.fn(),
}));
vi.mock("jszip", () => ({
  default: class {
    file = mocks.zipFile;
    generateAsync = mocks.zipGenerate;
  },
}));

afterEach(() => vi.unstubAllGlobals());

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
  mocks.url.mockResolvedValue("https://example.invalid/resume");
  mocks.metadata.mockResolvedValue({ contentType: "application/pdf", name: "synthetic-id" });
  mocks.zipGenerate.mockResolvedValue(new Blob(["zip"]));
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  vi.stubGlobal(
    "URL",
    Object.assign(URL, { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: vi.fn() }),
  );
});

describe("resume storage", () => {
  it.each([
    ["application/pdf", "pdf"],
    ["image/png", "png"],
    ["image/jpeg", "jpg"],
    ["application/msword", "doc"],
    ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ])("recovers the extension from %s metadata", async (contentType, extension) => {
    mocks.metadata.mockResolvedValue({ contentType, name: "synthetic-id" });
    expect(await getApplicantResumeFile("synthetic-id")).toMatchObject({
      filename: `resume_synthetic-id.${extension}`,
      contentType,
    });
  });

  it("preserves and decodes a metadata filename without exposing a path", async () => {
    mocks.metadata.mockResolvedValue({
      contentType: "application/msword",
      contentDisposition: "attachment; filename*=UTF-8''My%20Resume.docx",
    });
    expect((await getApplicantResumeFile("synthetic-id"))?.filename).toBe("My Resume.docx");
  });

  it.each(["png", "jpg", "jpeg"])("preserves an original .%s filename", async (extension) => {
    mocks.metadata.mockResolvedValue({
      contentType: "application/octet-stream",
      contentDisposition: `attachment; filename="resume.${extension}"`,
    });
    expect((await getApplicantResumeFile("synthetic-id"))?.filename).toBe(`resume.${extension}`);
  });

  it("sanitizes paths and handles malformed filename encoding", async () => {
    mocks.metadata.mockResolvedValue({
      contentType: "application/msword",
      contentDisposition: "attachment; filename=\"../legacy.doc\"; filename*=UTF-8''%broken",
    });
    expect((await getApplicantResumeFile("synthetic-id"))?.filename).toBe(".._legacy.doc");
  });

  it("does not guess PDF for an unknown file type", async () => {
    mocks.metadata.mockResolvedValue({
      contentType: "application/octet-stream",
      name: "synthetic-id",
    });
    expect((await getApplicantResumeFile("synthetic-id"))?.filename).toBe("resume_synthetic-id");
  });

  it("returns null only for an absent object and propagates permission errors", async () => {
    mocks.url.mockRejectedValueOnce({ code: "storage/object-not-found" });
    expect(await getApplicantResumeFile("synthetic-id")).toBeNull();
    mocks.url.mockRejectedValueOnce({ code: "storage/unauthorized" });
    await expect(getApplicantResumeFile("synthetic-id")).rejects.toMatchObject({
      code: "storage/unauthorized",
    });
  });

  it("downloads a blob with a usable extension instead of relying on a cross-origin download attribute", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["docx"]) }),
    );
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.href).toBe("blob:test");
      expect(this.download).toBe("resume.docx");
    });
    await downloadApplicantResume({ url: "https://example.invalid/file", filename: "resume.docx" });
    expect(click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("rejects failed downloads without creating an empty file", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    await expect(
      downloadApplicantResume({ url: "https://example.invalid/file", filename: "resume.docx" }),
    ).rejects.toThrow("403");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("uses the downloaded MIME type for legacy URLs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () =>
          new Blob(["docx"], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          }),
      }),
    );
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.download).toBe("resume.docx");
    });
    await downloadApplicantResume({ url: "https://example.invalid/file", filename: "resume" });
    expect(click).toHaveBeenCalledOnce();
  });

  it("does not export resumes for applicants without sponsor consent", async () => {
    await expect(
      getAllApplicantResumes([{ _id: "private" } as Applicant], "test-event"),
    ).rejects.toThrow("No applicants");
    expect(mocks.url).not.toHaveBeenCalled();
  });

  it("finds consented uploads even when the Firestore resume field is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["pdf"]) }),
    );
    await getAllApplicantResumes(
      [{ _id: "legacy", termsAndConditions: { shareWithSponsors: true } } as Applicant],
      "test-event",
    );
    expect(mocks.zipFile).toHaveBeenCalledOnce();
  });

  it("rejects failed ZIP downloads rather than reporting partial success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(
      getAllApplicantResumes(
        [{ _id: "broken", termsAndConditions: { shareWithSponsors: true } } as Applicant],
        "test-event",
      ),
    ).rejects.toThrow("500");
    expect(mocks.zipGenerate).not.toHaveBeenCalled();
  });

  it.each([
    ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
    ["image/png", "png"],
    ["image/jpeg", "jpg"],
  ])(
    "keeps %s files correctly named in sponsor ZIPs and excludes applicants without consent",
    async (contentType, extension) => {
      mocks.metadata.mockResolvedValue({ contentType });
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["docx"]) }),
      );
      const applicant = (_id: string, shareWithSponsors: boolean) =>
        ({
          _id,
          basicInfo: { firstName: "Test", lastName: "Applicant" },
          skills: { resume: "https://example.invalid/file" },
          termsAndConditions: { shareWithSponsors },
        }) as Applicant;
      await getAllApplicantResumes(
        [applicant("allowed", true), applicant("private", false)],
        "test-event",
      );
      expect(mocks.zipFile).toHaveBeenCalledWith(
        `Test Applicant_allowed.${extension}`,
        expect.any(Blob),
        {
          binary: true,
        },
      );
      expect(mocks.zipFile).toHaveBeenCalledTimes(1);
      expect(mocks.url).toHaveBeenCalledWith({ fullPath: "applicantResumes/allowed" });
    },
  );
});
