import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ updateDoc: vi.fn(), onSnapshot: vi.fn() }));
vi.mock("@/lib/firebase/client", () => ({
  db: {},
  auth: { currentUser: { email: "admin@example.org" } },
}));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, ...path: string[]) => path.join("/"),
  Timestamp: { now: () => "now" },
  updateDoc: mocks.updateDoc,
  onSnapshot: mocks.onSnapshot,
}));
import { subscribeToGradingPeriod, updateGradingPeriod } from "./grading-period";
beforeEach(() => vi.clearAllMocks());
it("updates only the event grading flag while preserving sibling feature flags", async () => {
  await updateGradingPeriod("HackCamp2026", true);
  expect(mocks.updateDoc).toHaveBeenCalledWith("Hackathons/HackCamp2026", {
    "featureFlags.gradingPeriod": true,
    lastEdited: "now",
    lastEditedBy: "admin@example.org",
  });
});
it("defaults absent flags to false and forwards subscription errors and cleanup", () => {
  const stop = vi.fn();
  mocks.onSnapshot.mockReturnValue(stop);
  const change = vi.fn();
  const error = vi.fn();
  expect(subscribeToGradingPeriod("HackCamp2026", change, error)).toBe(stop);
  const [, next, fail] = mocks.onSnapshot.mock.calls[0];
  next({ exists: () => true, data: () => ({}) });
  expect(change).toHaveBeenLastCalledWith(false);
  next({ exists: () => true, data: () => ({ featureFlags: { gradingPeriod: true } }) });
  expect(change).toHaveBeenLastCalledWith(true);
  expect(fail).toBe(error);
  next({ exists: () => false });
  expect(error).toHaveBeenCalledWith(expect.any(Error));
  expect(change).toHaveBeenCalledTimes(2);
});
