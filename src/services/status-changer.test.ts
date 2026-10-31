import { beforeEach, describe, expect, it, vi } from "vitest";

interface FixtureApplicant {
  id: string;
  event: string;
  basicInfo?: { email?: string };
  status?: { applicationStatus?: string };
  submission?: { submitted?: boolean };
}

const mocks = vi.hoisted(() => ({
  applicants: [] as FixtureApplicant[],
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock("@/lib/firebase/client", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: (_db: unknown, ...path: string[]) => path,
  doc: (_db: unknown, ...path: string[]) => path,
  where: (field: string, operator: string, values: string[]) => ({ field, operator, values }),
  query: (path: string[], condition: { values: string[] }) => ({ path, condition }),
  getDocs: mocks.getDocs,
  updateDoc: mocks.updateDoc,
}));

import { updateApplicantsStatusByEmails } from "./status-changer";

const applicant = (
  id: string,
  email: string,
  overrides: Partial<FixtureApplicant> = {},
): FixtureApplicant => ({
  id,
  event: "hackcamp",
  basicInfo: { email },
  status: { applicationStatus: "applied" },
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.applicants = [];
  mocks.updateDoc.mockResolvedValue(undefined);
  mocks.getDocs.mockImplementation(async (request) => {
    const path = Array.isArray(request) ? request : request.path;
    const condition = Array.isArray(request) ? undefined : request.condition;
    return {
      docs: mocks.applicants
        .filter((record) => record.event === path[1])
        .filter((record) => !condition || condition.values.includes(record.basicInfo?.email))
        .map((record) => ({ id: record.id, data: () => record })),
    };
  });
});

describe("updateApplicantsStatusByEmails", () => {
  it("matches stored capitalization and whitespace and deduplicates requested addresses", async () => {
    mocks.applicants = [applicant("one", " Applicant@Example.org ")];
    const result = await updateApplicantsStatusByEmails(
      "hackcamp",
      [" applicant@example.org ", "APPLICANT@EXAMPLE.ORG", ""],
      "waitlisted",
    );
    expect(result).toEqual({
      updatedCount: 1,
      matchedEmails: ["applicant@example.org"],
      notFoundEmails: [],
    });
    expect(mocks.updateDoc).toHaveBeenCalledExactlyOnceWith(
      ["Hackathons", "hackcamp", "Applicants", "one"],
      { "status.applicationStatus": "waitlisted" },
    );
  });

  it("only changes submitted applications within the selected hackathon", async () => {
    mocks.applicants = [
      applicant("submitted", "one@example.org"),
      applicant("draft", "draft@example.org", { status: { applicationStatus: "inProgress" } }),
      applicant("missing", "missing@example.org", { status: undefined }),
      applicant("empty", "empty@example.org", { status: {} }),
      applicant("unsubmitted", "unsubmitted@example.org", { submission: { submitted: false } }),
      applicant("other-event", "one@example.org", { event: "other-event" }),
    ];
    const result = await updateApplicantsStatusByEmails(
      "hackcamp",
      [
        "one@example.org",
        "draft@example.org",
        "missing@example.org",
        "empty@example.org",
        "unsubmitted@example.org",
        "absent@example.org",
      ],
      "waitlisted",
    );
    expect(result.updatedCount).toBe(1);
    expect(result.matchedEmails).toEqual(["one@example.org"]);
    expect(result.notFoundEmails).toEqual([
      "draft@example.org",
      "missing@example.org",
      "empty@example.org",
      "unsubmitted@example.org",
      "absent@example.org",
    ]);
    expect(mocks.updateDoc).toHaveBeenCalledTimes(1);
  });

  it("updates all eligible applicants with the same normalized email once each", async () => {
    mocks.applicants = [applicant("one", "same@example.org"), applicant("two", "Same@Example.org")];
    const result = await updateApplicantsStatusByEmails(
      "hackcamp",
      ["same@example.org"],
      "rejected",
    );
    expect(result).toEqual({
      updatedCount: 2,
      matchedEmails: ["same@example.org"],
      notFoundEmails: [],
    });
    expect(mocks.updateDoc).toHaveBeenCalledTimes(2);
  });

  it("does not read or write for blank input", async () => {
    expect(await updateApplicantsStatusByEmails("hackcamp", [" ", ""], "rejected")).toEqual({
      updatedCount: 0,
      matchedEmails: [],
      notFoundEmails: [],
    });
    expect(mocks.getDocs).not.toHaveBeenCalled();
    expect(mocks.updateDoc).not.toHaveBeenCalled();
  });

  it("ignores applicants without an email and reports unmatched requests", async () => {
    mocks.applicants = [applicant("missing", "", { basicInfo: undefined })];
    expect(
      await updateApplicantsStatusByEmails("hackcamp", ["missing@example.org"], "rejected"),
    ).toEqual({
      updatedCount: 0,
      matchedEmails: [],
      notFoundEmails: ["missing@example.org"],
    });
    expect(mocks.updateDoc).not.toHaveBeenCalled();
  });

  it("propagates write failures instead of claiming success", async () => {
    mocks.applicants = [applicant("one", "one@example.org")];
    mocks.updateDoc.mockRejectedValueOnce(new Error("permission denied"));
    await expect(
      updateApplicantsStatusByEmails("hackcamp", ["one@example.org"], "rejected"),
    ).rejects.toThrow("permission denied");
  });
});
