import { describe, expect, it } from "vitest";
import { buildRaffleEntrants, stampPointsById, sumCtfPointsByEmail, totalEntries } from "./raffle";

const names = new Map([
  ["alice@example.com", { preferredName: "Alice", lastName: "Applicant" }],
  ["carol@example.com", { preferredName: "Carol", lastName: "Coder" }],
]);

const stamps = [
  { _id: "s1", points: 3 },
  { _id: "s2" },
  { _id: "zero", points: 0 },
  { _id: "s5", points: 5 },
];
const values = stampPointsById(stamps);

describe("stampPointsById", () => {
  it("maps stamp IDs to their point values, defaulting to 1", () => {
    expect([...values.entries()]).toEqual([
      ["s1", 3],
      ["s2", 1],
      ["zero", 0],
      ["s5", 5],
    ]);
  });

  it("leaves out stamps without an ID", () => {
    expect(stampPointsById([{ points: 4 }]).size).toBe(0);
  });
});

describe("buildRaffleEntrants", () => {
  it("counts each stamp for its point value, merged by lowercased email", () => {
    const entrants = buildRaffleEntrants(
      [
        { email: "Alice@Example.com", displayName: "Al", stampId: "s1" },
        { email: "alice@example.com", displayName: "Al", stampId: "s2" },
        { email: "bob@example.com", displayName: "User", stampId: "s5" },
      ],
      values,
      names,
    );

    expect(entrants).toEqual([
      { email: "alice@example.com", preferredName: "Al", lastName: "Applicant", entries: 4 },
      { email: "bob@example.com", preferredName: "User", lastName: "", entries: 5 },
    ]);
  });

  it("counts a repeated stamp once", () => {
    const entrants = buildRaffleEntrants(
      [
        { email: "bob@example.com", displayName: "Bo", stampId: "s5" },
        { email: "bob@example.com", displayName: "Bo", stampId: "s5" },
      ],
      values,
      names,
    );

    expect(entrants.map((entrant) => entrant.entries)).toEqual([5]);
  });

  it("leaves out 0-point stamps, deleted stamps and hackers left with 0 points", () => {
    const entrants = buildRaffleEntrants(
      [
        { email: "bob@example.com", displayName: "Bo", stampId: "zero" },
        { email: "bob@example.com", displayName: "Bo", stampId: "deleted" },
        { email: "alice@example.com", displayName: "Al", stampId: "s2" },
      ],
      values,
      names,
    );

    expect(entrants).toEqual([
      { email: "alice@example.com", preferredName: "Al", lastName: "Applicant", entries: 1 },
    ]);
  });

  it("adds CTF points to stamp points for the same hacker", () => {
    const entrants = buildRaffleEntrants(
      [{ email: "alice@example.com", displayName: "Al", stampId: "s1" }],
      values,
      names,
      new Map([["ALICE@example.com", 10]]),
    );

    expect(entrants).toEqual([
      { email: "alice@example.com", preferredName: "Al", lastName: "Applicant", entries: 13 },
    ]);
  });

  it("adds hackers who only have CTF points, named from their application", () => {
    const entrants = buildRaffleEntrants([], values, names, new Map([["carol@example.com", 7]]));

    expect(entrants).toEqual([
      { email: "carol@example.com", preferredName: "Carol", lastName: "Coder", entries: 7 },
    ]);
  });

  it("ignores zero or non-finite CTF points and blank emails", () => {
    const entrants = buildRaffleEntrants(
      [{ email: "  ", displayName: "Nobody", stampId: "s1" }],
      values,
      names,
      new Map([
        ["carol@example.com", 0],
        ["dave@example.com", Number.NaN],
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
      { email: "bob@example.com", points: Number.NaN },
      { email: "bob@example.com", points: "7" as unknown as number },
      { email: "carol@example.com", points: Number.POSITIVE_INFINITY },
    ]);

    expect([...points.entries()]).toEqual([
      ["alice@example.com", 11],
      ["bob@example.com", 2],
    ]);
  });
});
