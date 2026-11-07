import { describe, expect, it } from "vitest";
import { isHackathonEvent } from "./utils";

describe("isHackathonEvent", () => {
  it("accepts a hackathon name followed by its four-digit year", () => {
    expect(isHackathonEvent("HackCamp2026")).toBe(true);
    expect(isHackathonEvent("cmd-f2026")).toBe(true);
    expect(isHackathonEvent("LHD2021")).toBe(true);
  });

  it("rejects the documents that live beside the events", () => {
    expect(isHackathonEvent("blacklist")).toBe(false);
    expect(isHackathonEvent("www")).toBe(false);
    expect(isHackathonEvent("WrappedTestHackathon")).toBe(false);
    expect(isHackathonEvent("2026")).toBe(false);
  });
});
