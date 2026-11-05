import type { WrappedEmailLedger } from "@/lib/firebase/types";
import {
  countWrappedEmailRecipients,
  loadWrappedEmailRecipientUids,
  startWrappedEmailDelivery,
  subscribeToWrappedEmailLedger,
} from "@/services/wrapped-email";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WrappedEmailControl } from "./wrapped-email-control";

// No Firebase client, callable, or delivery service is loaded by this test.
vi.mock("@/services/wrapped-email", () => ({
  countWrappedEmailRecipients: vi.fn(),
  loadWrappedEmailRecipientUids: vi.fn(),
  startWrappedEmailDelivery: vi.fn(),
  subscribeToWrappedEmailLedger: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let publish: (ledger: WrappedEmailLedger | null) => void;
const unsubscribe = vi.fn();
const ready = { isReady: true, bannerUrl: "https://example.invalid/banner.png" };
const fixture = (overrides: Partial<WrappedEmailLedger> = {}): WrappedEmailLedger => ({
  runId: "fixture",
  status: "sending",
  lastClickedAt: Timestamp.fromMillis(Date.now()),
  updatedAt: Timestamp.fromMillis(Date.now()),
  startedByEmail: "admin@example.invalid",
  total: 6,
  processed: 5,
  sent: 2,
  skipped: 2,
  failed: 1,
  uncertain: 0,
  recipients: {
    a: { s: "sent" },
    b: { s: "sent" },
    c: { s: "skipped", r: "no-wrapped-doc" },
    d: { s: "skipped", r: "opted-out" },
    e: { s: "failed", e: "Mailbox full" },
  },
  ...overrides,
});
const sendButton = () =>
  screen.getByRole("button", { name: /Wrapped emails|Retry remaining/ }) as HTMLButtonElement;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(subscribeToWrappedEmailLedger).mockImplementation((_id, onChange) => {
    publish = onChange;
    return unsubscribe;
  });
  vi.mocked(loadWrappedEmailRecipientUids).mockResolvedValue(["a", "b", "c", "d", "e", "f"]);
  vi.mocked(countWrappedEmailRecipients).mockResolvedValue(42);
  vi.mocked(startWrappedEmailDelivery).mockResolvedValue({ runId: "fixture", started: true });
});
afterEach(cleanup);

describe("WrappedEmailControl", () => {
  it("builds counters from the ledger recipients map, including not sent", async () => {
    render(<WrappedEmailControl hackathonId="HackCamp2099" settings={ready} />);
    act(() => publish(fixture()));
    expect(await screen.findByRole("button", { name: "Not sent 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sent 2" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Skipped 2" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Failed 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Uncertain 0" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Not sent 1" }));
    expect(screen.getByRole("heading", { name: "Not sent UIDs" })).toBeTruthy();
    expect(screen.getByText("f")).toBeTruthy();
  });

  it("shows skip reasons and errors in the UID dialog", async () => {
    render(<WrappedEmailControl hackathonId="HackCamp2099" settings={ready} />);
    act(() => publish(fixture()));
    await screen.findByRole("button", { name: "Not sent 1" });
    fireEvent.click(screen.getByRole("button", { name: "Skipped 2" }));
    expect(screen.getByText("c")).toBeTruthy();
    expect(screen.getByText("No Wrapped doc")).toBeTruthy();
    expect(screen.getByText("Opted out")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Failed 1" }));
    expect(screen.getByText("Mailbox full")).toBeTruthy();
  });

  it("asks for confirmation with the recipient count before starting", async () => {
    render(<WrappedEmailControl hackathonId="HackCamp2099" settings={ready} />);
    act(() => publish(null));
    fireEvent.click(screen.getByRole("button", { name: "Send Wrapped emails" }));
    expect(countWrappedEmailRecipients).toHaveBeenCalledExactlyOnceWith("HackCamp2099");
    expect(screen.getByRole("heading", { name: "Send Wrapped emails?" })).toBeTruthy();
    expect(
      await screen.findByText(
        "This will email up to 42 checked-in hackers not yet emailed. Hackers without a Wrapped or who opted out are skipped.",
      ),
    ).toBeTruthy();
    expect(screen.getByText(/pnpm wrapped write/)).toBeTruthy();
    expect(startWrappedEmailDelivery).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Send emails" }));
    await waitFor(() =>
      expect(startWrappedEmailDelivery).toHaveBeenCalledExactlyOnceWith("HackCamp2099"),
    );
  });

  it("reloads recipient uids once when a run finishes", async () => {
    render(<WrappedEmailControl hackathonId="HackCamp2099" settings={ready} />);
    await waitFor(() => expect(loadWrappedEmailRecipientUids).toHaveBeenCalledOnce());
    act(() => publish(fixture()));
    act(() => publish(fixture({ processed: 6 })));
    expect(loadWrappedEmailRecipientUids).toHaveBeenCalledOnce();

    vi.mocked(loadWrappedEmailRecipientUids).mockResolvedValue(["a", "b", "c", "d", "e", "f", "g"]);
    act(() => publish(fixture({ status: "completed-with-errors", processed: 6 })));
    await waitFor(() => expect(loadWrappedEmailRecipientUids).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("button", { name: "Not sent 2" })).toBeTruthy();
    act(() => publish(fixture({ status: "completed-with-errors", processed: 6 })));
    expect(loadWrappedEmailRecipientUids).toHaveBeenCalledTimes(2);
  });

  it("does not reload on the first snapshot of an already finished run", async () => {
    render(<WrappedEmailControl hackathonId="HackCamp2099" settings={ready} />);
    act(() => publish(fixture({ status: "completed" })));
    await screen.findByRole("button", { name: "Not sent 1" });
    expect(loadWrappedEmailRecipientUids).toHaveBeenCalledOnce();
  });

  it("is disabled until Wrapped is released and has a banner, and while editing", () => {
    vi.mocked(loadWrappedEmailRecipientUids).mockReturnValue(new Promise(() => {}));
    const view = render(<WrappedEmailControl hackathonId="HackCamp2099" settings={{}} />);
    act(() => publish(null));
    expect(sendButton().disabled).toBe(true);
    expect(screen.getByText("Release Hacker Wrapped before sending emails.")).toBeTruthy();

    view.rerender(<WrappedEmailControl hackathonId="HackCamp2099" settings={{ isReady: true }} />);
    expect(sendButton().disabled).toBe(true);
    expect(screen.getByText("Upload a Wrapped banner before sending emails.")).toBeTruthy();

    view.rerender(<WrappedEmailControl hackathonId="HackCamp2099" settings={ready} disabled />);
    expect(sendButton().disabled).toBe(true);
    expect(screen.getByText("Save or cancel your settings changes before sending.")).toBeTruthy();

    view.rerender(<WrappedEmailControl hackathonId="HackCamp2099" settings={ready} />);
    expect(sendButton().disabled).toBe(false);
  });
});
