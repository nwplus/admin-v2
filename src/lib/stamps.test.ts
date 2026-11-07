import { describe, expect, it } from "vitest";
import { needsStampQrRegeneration, readUnlockedStamps, stampBelongsToHackathon } from "./stamps";

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

describe("stampBelongsToHackathon", () => {
  it("matches the stamp's hackathon ignoring case, and counts hackathon-less stamps everywhere", () => {
    expect(stampBelongsToHackathon({ hackathon: "HackCamp2026" }, "HackCamp2026")).toBe(true);
    expect(stampBelongsToHackathon({ hackathon: "hackcamp2026" }, "HackCamp2026")).toBe(true);
    expect(stampBelongsToHackathon({ hackathon: "cmd-f2026" }, "HackCamp2026")).toBe(false);
    expect(stampBelongsToHackathon({}, "HackCamp2026")).toBe(true);
  });
});

describe("readUnlockedStamps", () => {
  const stamps = new Map([
    ["hc", { hackathon: "HackCamp2026" }],
    ["cf", { hackathon: "cmd-f2026" }],
    ["global", {}],
  ]);

  it("reads the map entry for the exact hackathon ID, as an array or a truthy map", () => {
    expect(readUnlockedStamps({ HackCamp2026: ["hc", "global"] }, "HackCamp2026", stamps)).toEqual([
      "hc",
      "global",
    ]);
    expect(
      readUnlockedStamps({ HackCamp2026: { hc: true, global: false } }, "HackCamp2026", stamps),
    ).toEqual(["hc"]);
  });

  it("reads a slug-keyed bucket but only keeps the stamps belonging to this hackathon", () => {
    const slugKeyed = { hackcamp: ["hc", "cf", "global"] };
    expect(readUnlockedStamps(slugKeyed, "HackCamp2026", stamps)).toEqual(["hc", "global"]);
    expect(readUnlockedStamps(slugKeyed, "HackCamp2025", stamps)).toEqual(["global"]);
    expect(readUnlockedStamps({ nwhacks: ["hc"] }, "nwHacks2026", stamps)).toEqual([]);
  });

  it("does not read another year's bucket", () => {
    expect(readUnlockedStamps({ HackCamp2025: ["hc"] }, "HackCamp2026", stamps)).toEqual([]);
  });

  it("scopes a flat array by each stamp's own hackathon instead of counting it everywhere", () => {
    const flat = ["hc", "cf", "global", "deleted"];
    expect(readUnlockedStamps(flat, "HackCamp2026", stamps)).toEqual(["hc", "global"]);
    expect(readUnlockedStamps(flat, "cmd-f2026", stamps)).toEqual(["cf", "global"]);
    expect(readUnlockedStamps(flat, "nwHacks2026", stamps)).toEqual(["global"]);
  });

  it("drops a stamp filed under one hackathon that has since moved to another", () => {
    expect(readUnlockedStamps({ HackCamp2026: ["cf"] }, "HackCamp2026", stamps)).toEqual([]);
  });

  it("reads nothing from a missing or malformed field", () => {
    expect(readUnlockedStamps(undefined, "HackCamp2026", stamps)).toEqual([]);
    expect(readUnlockedStamps("hc", "HackCamp2026", stamps)).toEqual([]);
    expect(readUnlockedStamps({ HackCamp2026: 3 }, "HackCamp2026", stamps)).toEqual([]);
  });
});
