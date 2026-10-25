import { describe, expect, it } from "vitest";
import { buildRaffleEntrants, sumCtfPointsByEmail, totalEntries } from "./raffle";

const names = new Map([
  ["alice@example.com", { preferredName: "Alice", lastName: "Applicant" }],
  ["carol@example.com", { preferredName: "Carol", lastName: "Coder" }],
]);

describe("buildRaffleEntrants", () => {
  it("counts one entry per stamp, merged by lowercased email", () => {
    const entrants = buildRaffleEntrants(
      [
        { email: "Alice@Example.com", displayName: "Al" },
        { email: "alice@example.com", displayName: "Al" },
        { email: "bob@example.com", displayName: "User" },
      ],
      names,
    );

    expect(entrants).toEqual([
      { email: "alice@example.com", preferredName: "Al", lastName: "Applicant", entries: 2 },
      { email: "bob@example.com", preferredName: "User", lastName: "", entries: 1 },
    ]);
  });

  it("adds CTF points to stamp entries for the same hacker", () => {
    const entrants = buildRaffleEntrants(
      [{ email: "alice@example.com", displayName: "Al" }],
      names,
      new Map([["ALICE@example.com", 10]]),
    );

    expect(entrants).toEqual([
      { email: "alice@example.com", preferredName: "Al", lastName: "Applicant", entries: 11 },
    ]);
  });

  it("adds hackers who only have CTF points, named from their application", () => {
    const entrants = buildRaffleEntrants([], names, new Map([["carol@example.com", 7]]));

    expect(entrants).toEqual([
      { email: "carol@example.com", preferredName: "Carol", lastName: "Coder", entries: 7 },
    ]);
  });

  it("ignores zero points and blank emails", () => {
    const entrants = buildRaffleEntrants(
      [{ email: "  ", displayName: "Nobody" }],
      names,
      new Map([
        ["carol@example.com", 0],
        ["", 5],
      ]),
    );

    expect(entrants).toEqual([]);
    expect(totalEntries(entrants)).toBe(0);
  });
});

describe("sumCtfPointsByEmail", () => {
  it("sums each hacker's solves by lowercased, trimmed email", () => {
    const points = sumCtfPointsByEmail([
      { email: "Alice@example.com ", points: 10 },
      { email: "alice@example.com", points: 1 },
      { email: "bob@example.com", points: 2 },
      { email: "", points: 5 },
    ]);

    expect([...points.entries()]).toEqual([
      ["alice@example.com", 11],
      ["bob@example.com", 2],
    ]);
  });
});
