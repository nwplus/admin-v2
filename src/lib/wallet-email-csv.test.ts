import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import { buildWalletEmailCsv } from "./wallet-email-csv";

const header = "uid,email,status,attempts,lastAttemptedAt,sentAt,updatedAt,error,batchId,sentBy";

describe("buildWalletEmailCsv", () => {
  it("includes applicants without a send record as notSent", () => {
    const timestamp = Timestamp.fromDate(new Date("2026-11-01T12:00:00.000Z"));
    const csv = buildWalletEmailCsv(
      [
        { uid: "a", email: "a@example.com" },
        { uid: "b", email: "b@example.com" },
      ],
      [
        {
          uid: "a",
          email: "a@example.com",
          status: "sent",
          attempts: 1,
          sentAt: timestamp,
          updatedAt: timestamp,
          batchId: "batch-1",
          sentBy: "admin@example.com",
        },
      ],
    );
    const [headerRow, first, second] = csv.split("\n");

    expect(headerRow).toBe(header);
    expect(first).toBe(
      "a,a@example.com,sent,1,,2026-11-01T12:00:00.000Z,2026-11-01T12:00:00.000Z,,batch-1,admin@example.com",
    );
    expect(second).toBe("b,b@example.com,notSent,0,,,,,,");
  });

  it("escapes commas, quotes, and newlines", () => {
    const csv = buildWalletEmailCsv(
      [{ uid: "a", email: 'weird,"email"@example.com' }],
      [
        {
          uid: "a",
          status: "failed",
          error: 'Line one\nLine "two", comma',
          batchId: "batch,1",
          sentBy: 'Admin "A"',
        },
      ],
    );

    expect(csv).toContain('"weird,""email""@example.com"');
    expect(csv).toContain('"Line one\nLine ""two"", comma"');
    expect(csv).toContain('"batch,1"');
    expect(csv).toContain('"Admin ""A"""');
  });
});
