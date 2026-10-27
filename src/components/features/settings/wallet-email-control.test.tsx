import type { WalletEmailDelivery, WalletEmailSend } from "@/lib/firebase/types";
import {
  countWalletEmailRecipients,
  startWalletEmailDelivery,
  subscribeToWalletEmailDelivery,
  subscribeToWalletEmailRecipients,
  subscribeToWalletEmailSends,
} from "@/services/wallet-email";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletEmailControl } from "./wallet-email-control";

// No Firebase client, callable, queue, or delivery service is loaded by this test.
vi.mock("@/services/wallet-email", () => ({
  countWalletEmailRecipients: vi.fn(),
  startWalletEmailDelivery: vi.fn(),
  subscribeToWalletEmailDelivery: vi.fn(),
  subscribeToWalletEmailRecipients: vi.fn(),
  subscribeToWalletEmailSends: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let publish: (state: WalletEmailDelivery | null) => void;
let fail: (error: Error) => void;
let publishSends: (sends: WalletEmailSend[]) => void;
let failSends: (error: Error) => void;
let publishRecipients: (uids: string[]) => void;
const unsubscribe = vi.fn();
const unsubscribeSends = vi.fn();
const unsubscribeRecipients = vi.fn();
const fixture = (overrides: Partial<WalletEmailDelivery> = {}): WalletEmailDelivery => ({
  runId: "fixture",
  status: "sending",
  lastClickedAt: Timestamp.fromMillis(Date.now()),
  updatedAt: Timestamp.fromMillis(Date.now()),
  startedByEmail: "admin@example.invalid",
  total: 100,
  processed: 50,
  sent: 40,
  skipped: 10,
  failed: 0,
  uncertain: 0,
  currentProgress: { sent: 5, skipped: 0, failed: 0, uncertain: 0 },
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(subscribeToWalletEmailDelivery).mockImplementation((_id, onChange, onError) => {
    publish = onChange;
    fail = onError;
    return unsubscribe;
  });
  vi.mocked(subscribeToWalletEmailSends).mockImplementation((_id, onChange, onError) => {
    publishSends = onChange;
    failSends = onError;
    return unsubscribeSends;
  });
  vi.mocked(subscribeToWalletEmailRecipients).mockImplementation((_id, onChange) => {
    publishRecipients = onChange;
    return unsubscribeRecipients;
  });
  vi.mocked(countWalletEmailRecipients).mockResolvedValue(42);
  vi.mocked(startWalletEmailDelivery).mockResolvedValue({ runId: "fixture", started: true });
});
afterEach(cleanup);

describe("WalletEmailControl", () => {
  it("waits for shared status before allowing a click", () => {
    render(<WalletEmailControl hackathonId="HackCamp2099" />);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    act(() => publish(null));
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText("Not sent yet.")).toBeTruthy();
  });

  it("asks for confirmation and shows how many applicants will be emailed", async () => {
    render(<WalletEmailControl hackathonId="HackCamp2099" />);
    act(() => publish(null));
    fireEvent.click(screen.getByRole("button", { name: "Send wallet emails" }));
    expect(countWalletEmailRecipients).toHaveBeenCalledExactlyOnceWith("HackCamp2099");
    expect(screen.getByRole("heading", { name: "Send wallet emails?" })).toBeTruthy();
    expect(
      await screen.findByText("This will email 42 applicants marked accepted and attending."),
    ).toBeTruthy();
    expect(screen.getByText(/Apple passes have been created/)).toBeTruthy();
    expect(startWalletEmailDelivery).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Send emails" }));
    await waitFor(() =>
      expect(startWalletEmailDelivery).toHaveBeenCalledExactlyOnceWith("HackCamp2099"),
    );
  });

  it("blocks confirmation when nobody is accepted and attending", async () => {
    vi.mocked(countWalletEmailRecipients).mockResolvedValue(0);
    render(<WalletEmailControl hackathonId="HackCamp2099" />);
    act(() => publish(null));
    fireEvent.click(screen.getByRole("button", { name: "Send wallet emails" }));
    expect(
      await screen.findByText(
        "No applicants are marked accepted and attending, so there is nobody to email.",
      ),
    ).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Send emails" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(startWalletEmailDelivery).not.toHaveBeenCalled();
  });

  it("starts one server job even on repeated confirmations", async () => {
    let finish: (result: { runId: string; started: boolean }) => void = () => {};
    vi.mocked(startWalletEmailDelivery).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    render(<WalletEmailControl hackathonId="HackCamp2099" />);
    act(() => publish(null));
    fireEvent.click(screen.getByRole("button", { name: "Send wallet emails" }));
    await screen.findByText("This will email 42 applicants marked accepted and attending.");
    const confirm = screen.getByRole("button", { name: "Send emails" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(startWalletEmailDelivery).toHaveBeenCalledExactlyOnceWith("HackCamp2099");
    await act(async () => finish({ runId: "fixture", started: true }));
  });

  it("restores live progress and last-click information after remounting", () => {
    const view = render(<WalletEmailControl hackathonId="HackCamp2099" />);
    act(() => publish(fixture()));
    expect(screen.getByText("Sending wallet emails: 55 of 100 processed.")).toBeTruthy();
    expect(screen.getByText(/Last clicked/).textContent).toContain("admin@example.invalid");
    expect(
      (screen.getByRole("button", { name: /Sending wallet emails/ }) as HTMLButtonElement).disabled,
    ).toBe(true);
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
    render(<WalletEmailControl hackathonId="HackCamp2099" />);
    act(() => publish(fixture({ processed: 70, sent: 60 })));
    expect(screen.getByText("Sending wallet emails: 75 of 100 processed.")).toBeTruthy();
    expect(startWalletEmailDelivery).not.toHaveBeenCalled();
  });

  it("live counts email sends and lists uids by status", () => {
    render(<WalletEmailControl hackathonId="HackCamp2099" />);
    act(() => publish(fixture()));
    act(() => publishRecipients(["d", "a", "b", "c", "e"]));
    act(() =>
      publishSends([
        { uid: "a", status: "sent" },
        { uid: "b", status: "sending" },
        { uid: "c", status: "failed" },
        { uid: "e", status: "uncertain" },
      ]),
    );
    expect(screen.getByRole("button", { name: "Sending 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sent 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Failed 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Uncertain 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Not sent 1" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Not sent 1" }));
    expect(screen.getByRole("heading", { name: "Not sent UIDs" })).toBeTruthy();
    expect(screen.getByText("d")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Sent 1" }));
    expect(screen.getByRole("heading", { name: "Sent UIDs" })).toBeTruthy();
    expect(screen.getByText("a")).toBeTruthy();
  });

  it("updates the counters as sends progress", () => {
    render(<WalletEmailControl hackathonId="HackCamp2099" />);
    act(() => publish(fixture()));
    act(() => publishRecipients(["a", "b"]));
    act(() => publishSends([{ uid: "a", status: "sending" }]));
    expect(screen.getByRole("button", { name: "Sending 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Not sent 1" })).toBeTruthy();
    act(() => publishSends([{ uid: "a", status: "sent" }]));
    expect(screen.getByRole("button", { name: "Sent 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sending 0" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Not sent 1" })).toBeTruthy();
  });

  it("surfaces email send read errors instead of showing zero counts", () => {
    render(<WalletEmailControl hackathonId="HackCamp2099" />);
    act(() => publish(fixture()));
    act(() => publishRecipients(["a"]));
    act(() => failSends(new Error("Missing or insufficient permissions.")));
    act(() => publishRecipients(["a"]));
    expect(screen.getByText(/Could not load email send records/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Sent / })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Not sent / })).toBeNull();
  });

  it("shows failed runs and permits retry through the same button", async () => {
    render(<WalletEmailControl hackathonId="HackCamp2099" />);
    act(() => publish(fixture({ status: "failed", error: "Apple passes are missing." })));
    expect(screen.getByText("Apple passes are missing.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry remaining emails" }));
    await screen.findByText("This will email 42 applicants marked accepted and attending.");
    fireEvent.click(screen.getByRole("button", { name: "Send emails" }));
    await waitFor(() => expect(startWalletEmailDelivery).toHaveBeenCalledOnce());
  });

  it("blocks sending on subscription errors and while settings are being edited", () => {
    const view = render(<WalletEmailControl hackathonId="HackCamp2099" disabled />);
    act(() => publish(null));
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    view.rerender(<WalletEmailControl hackathonId="HackCamp2099" />);
    act(() => fail(new Error("fixture offline")));
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/fixture offline/)).toBeTruthy();
    expect(startWalletEmailDelivery).not.toHaveBeenCalled();
  });

  it("explains uncertain deliveries and permits recovery of a stale run", () => {
    render(<WalletEmailControl hackathonId="HackCamp2099" />);
    act(() =>
      publish(
        fixture({
          uncertain: 1,
          updatedAt: Timestamp.fromMillis(Date.now() - 61 * 60 * 1000),
        }),
      ),
    );
    expect(screen.getByText(/Check the sender mailbox/)).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Retry remaining emails" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });
});
