import { describe, expect, it } from "vitest";
import { needsStampQrRegeneration } from "./stamps";

describe("needsStampQrRegeneration", () => {
  it("generates a QR when enabling QR unlocking for the first time", () => {
    expect(
      needsStampQrRegeneration(null, { hackathon: "HackCamp2026", isQRUnlockable: true }),
    ).toBe(true);
    expect(
      needsStampQrRegeneration(
        { hackathon: "HackCamp2026", isQRUnlockable: false },
        { hackathon: "HackCamp2026", isQRUnlockable: true },
      ),
    ).toBe(true);
  });

  it("does not regenerate a QR when nothing relevant changed", () => {
    expect(
      needsStampQrRegeneration(
        { hackathon: "HackCamp2026", isQRUnlockable: true },
        { hackathon: "HackCamp2026", isQRUnlockable: true },
      ),
    ).toBe(false);
    expect(
      needsStampQrRegeneration(
        { hackathon: "HackCamp2025", isQRUnlockable: true },
        { hackathon: "HackCamp2026", isQRUnlockable: true },
      ),
    ).toBe(false);
  });

  it("regenerates a QR when the stamp moves to a hackathon with a different slug", () => {
    expect(
      needsStampQrRegeneration(
        { hackathon: "nwHacks2026", isQRUnlockable: true },
        { hackathon: "HackCamp2026", isQRUnlockable: true },
      ),
    ).toBe(true);
    expect(
      needsStampQrRegeneration(
        { hackathon: undefined, isQRUnlockable: true },
        { hackathon: "HackCamp2026", isQRUnlockable: true },
      ),
    ).toBe(true);
  });

  it("does not generate a QR when QR unlocking is off", () => {
    expect(
      needsStampQrRegeneration(
        { hackathon: "nwHacks2026", isQRUnlockable: true },
        { hackathon: "HackCamp2026", isQRUnlockable: false },
      ),
    ).toBe(false);
  });
});
