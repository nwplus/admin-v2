import { describe, expect, it } from "vitest";
import { stampPointValue } from "./points";

describe("stampPointValue", () => {
  it("uses the stamp's points, rounded down", () => {
    expect(stampPointValue({ points: 5 })).toBe(5);
    expect(stampPointValue({ points: 2.9 })).toBe(2);
  });

  it("keeps 0 as 0", () => {
    expect(stampPointValue({ points: 0 })).toBe(0);
    expect(stampPointValue({ points: 0.5 })).toBe(0);
  });

  it("is 1 when points is missing, negative or not a finite number", () => {
    expect(stampPointValue({})).toBe(1);
    expect(stampPointValue({ points: -1 })).toBe(1);
    expect(stampPointValue({ points: Number.NaN })).toBe(1);
    expect(stampPointValue({ points: Number.POSITIVE_INFINITY })).toBe(1);
    expect(stampPointValue({ points: "5" as unknown as number })).toBe(1);
  });
});
