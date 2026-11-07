import type { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import {
  buildRaffleEntrants,
  defaultRaffleHackathon,
  generateWinnersCSV,
  isOrganizerEmail,
  pickWeightedWinner,
  splitOrganizers,
  stampPointsById,
  sumCtfPointsByEmail,
  totalEntries,
} from "./raffle";

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

describe("splitOrganizers", () => {
  it("recognizes organizer emails by domain, whatever the casing", () => {
    expect(isOrganizerEmail("someone@nwplus.io")).toBe(true);
    expect(isOrganizerEmail("  Someone@NWPLUS.IO ")).toBe(true);
    expect(isOrganizerEmail("someone@gmail.com")).toBe(false);
    expect(isOrganizerEmail("nwplus.io")).toBe(false);
  });

  it("takes organizers out of the pool and keeps everyone else in order", () => {
    const alice = { email: "alice@example.com", preferredName: "Al", lastName: "", entries: 2 };
    const org = { email: "org@nwplus.io", preferredName: "Org", lastName: "", entries: 9 };
    const bob = { email: "bob@example.com", preferredName: "Bo", lastName: "", entries: 1 };

    expect(splitOrganizers([alice, org, bob])).toEqual({
      hackers: [alice, bob],
      organizers: [org],
    });
  });
});

describe("pickWeightedWinner", () => {
  const pool = [
    { email: "a@example.com", preferredName: "A", lastName: "", entries: 1 },
    { email: "b@example.com", preferredName: "B", lastName: "", entries: 3 },
  ];

  it("lands on each entrant in proportion to their entries", () => {
    expect(pickWeightedWinner(pool, () => 0)?.email).toBe("a@example.com");
    expect(pickWeightedWinner(pool, () => 0.249)?.email).toBe("a@example.com");
    expect(pickWeightedWinner(pool, () => 0.25)?.email).toBe("b@example.com");
    expect(pickWeightedWinner(pool, () => 0.999)?.email).toBe("b@example.com");
  });

  it("draws nobody from an empty pool", () => {
    expect(pickWeightedWinner([])).toBeNull();
  });
});

describe("defaultRaffleHackathon", () => {
  const ids = ["HackCamp2026", "nwHacks2026", "nwHacks2027", "cmd-f2026", "blacklist", "www"];

  it("picks the event whose season is nearest, not the highest year", () => {
    expect(defaultRaffleHackathon(ids, new Date(2026, 10, 7))).toBe("HackCamp2026");
    expect(defaultRaffleHackathon(ids, new Date(2027, 0, 20))).toBe("nwHacks2027");
    expect(defaultRaffleHackathon(ids, new Date(2026, 2, 1))).toBe("cmd-f2026");
  });

  it("prefers the upcoming event when two are equally near", () => {
    expect(defaultRaffleHackathon(ids, new Date(2026, 11, 15))).toBe("nwHacks2027");
  });

  it("never picks a non-event document, and falls back to the newest unknown-season event", () => {
    expect(defaultRaffleHackathon(["blacklist", "www"])).toBe("");
    expect(defaultRaffleHackathon(["LHD2021", "HealthX2020", "www"])).toBe("LHD2021");
  });
});

describe("generateWinnersCSV", () => {
  it("escapes fields and leaves pool columns blank for winners logged before they existed", () => {
    const csv = generateWinnersCSV([
      {
        prizeId: "p",
        prizeName: 'Air "Fryer"',
        preferredName: "Al",
        lastName: "A",
        email: "al@example.com",
        entryCount: 4,
        poolEntries: 222,
        poolSize: 49,
        drawnAt: { toDate: () => new Date(2026, 10, 7, 12, 0) } as unknown as Timestamp,
      },
      {
        prizeId: "p",
        prizeName: "Mug",
        preferredName: "Bo",
        lastName: "",
        email: "bo@example.com",
        entryCount: 1,
      },
    ]);

    const [header, first, second] = csv.split("\n");
    expect(header).toBe(
      '"Prize","Preferred Name","Last Name","Email","Entries","Pool Entries","Pool Size","Drawn At"',
    );
    expect(first.startsWith('"Air ""Fryer""","Al","A","al@example.com","4","222","49","')).toBe(
      true,
    );
    expect(second).toBe('"Mug","Bo","","bo@example.com","1","","",""');
  });
});
