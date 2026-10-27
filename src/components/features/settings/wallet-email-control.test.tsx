import type { WalletEmailDelivery } from "@/lib/firebase/types";
import { startWalletEmailDelivery, subscribeToWalletEmailDelivery } from "@/services/wallet-email";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletEmailControl } from "./wallet-email-control";

// No Firebase client, callable, queue, or delivery service is loaded by this test.
vi.mock("@/services/wallet-email", () => ({
  startWalletEmailDelivery: vi.fn(),
  subscribeToWalletEmailDelivery: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let publish: (state: WalletEmailDelivery | null) => void;
let fail: (error: Error) => void;
const unsubscribe = vi.fn();
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

  it("starts one server job even on repeated clicks", async () => {
    let finish: (result: { runId: string; started: boolean }) => void = () => {};
    vi.mocked(startWalletEmailDelivery).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    render(<WalletEmailControl hackathonId="HackCamp2099" />);
    act(() => publish(null));
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button"));
    expect(startWalletEmailDelivery).toHaveBeenCalledExactlyOnceWith("HackCamp2099");
    await act(async () => finish({ runId: "fixture", started: true }));
  });

  it("restores live progress and last-click information after remounting", () => {
    const view = render(<WalletEmailControl hackathonId="HackCamp2099" />);
    act(() => publish(fixture()));
    expect(screen.getByText("Sending wallet emails: 55 of 100 processed.")).toBeTruthy();
    expect(screen.getByText(/Last clicked/).textContent).toContain("admin@example.invalid");
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
    render(<WalletEmailControl hackathonId="HackCamp2099" />);
    act(() => publish(fixture({ processed: 70, sent: 60 })));
    expect(screen.getByText("Sending wallet emails: 75 of 100 processed.")).toBeTruthy();
    expect(startWalletEmailDelivery).not.toHaveBeenCalled();
  });

  it("shows failed runs and permits retry through the same button", async () => {
    render(<WalletEmailControl hackathonId="HackCamp2099" />);
    act(() => publish(fixture({ status: "failed", error: "Apple passes are missing." })));
    expect(screen.getByText("Apple passes are missing.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry remaining emails" }));
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
