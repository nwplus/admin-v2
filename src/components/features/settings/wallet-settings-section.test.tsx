import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WalletSettingsSection } from "./wallet-settings-section";

const mocks = vi.hoisted(() => ({
  getWalletEmailRecipients: vi.fn(),
  generateAppleWalletPasses: vi.fn(),
  subscribeToWalletEmailDelivery: vi.fn(),
  subscribeToWalletEmailSends: vi.fn(),
  subscribeToWalletEmailRecipients: vi.fn(),
  countWalletEmailRecipients: vi.fn(),
  startWalletEmailDelivery: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/services/wallet-email", () => ({
  getWalletEmailRecipients: mocks.getWalletEmailRecipients,
  subscribeToWalletEmailDelivery: mocks.subscribeToWalletEmailDelivery,
  subscribeToWalletEmailSends: mocks.subscribeToWalletEmailSends,
  subscribeToWalletEmailRecipients: mocks.subscribeToWalletEmailRecipients,
  countWalletEmailRecipients: mocks.countWalletEmailRecipients,
  startWalletEmailDelivery: mocks.startWalletEmailDelivery,
}));
vi.mock("@/services/wallet-passes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/wallet-passes")>()),
  generateAppleWalletPasses: mocks.generateAppleWalletPasses,
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

const renderSection = (walletAvailable: boolean) =>
  render(
    <WalletSettingsSection
      hackathonId="HackCamp2099"
      walletAvailable={walletAvailable}
      isEditing={false}
      isSaving={false}
      onWalletAvailableChange={vi.fn()}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.subscribeToWalletEmailDelivery.mockReturnValue(() => {});
  mocks.subscribeToWalletEmailSends.mockReturnValue(() => {});
  mocks.subscribeToWalletEmailRecipients.mockReturnValue(() => {});
  mocks.countWalletEmailRecipients.mockResolvedValue(0);
  mocks.startWalletEmailDelivery.mockResolvedValue({ runId: "fixture", started: true });
});
afterEach(cleanup);

describe("WalletSettingsSection", () => {
  it("warns that wallet buttons are hidden when Wallet Available is off", () => {
    const view = renderSection(false);

    expect(screen.getByRole("heading", { name: "Wallet" })).toBeTruthy();
    expect(screen.getByText(/buttons are hidden on hacker tickets/i)).toBeTruthy();
    expect(screen.getByText(/wallet emails and email links still work/i)).toBeTruthy();

    view.rerender(
      <WalletSettingsSection
        hackathonId="HackCamp2099"
        walletAvailable
        isEditing={false}
        isSaving={false}
        onWalletAvailableChange={vi.fn()}
      />,
    );
    expect(screen.queryByText(/buttons are hidden on hacker tickets/i)).toBeNull();
  });

  it("generates Apple passes in chunks of 25 and reports progress", async () => {
    const recipients = Array.from({ length: 30 }, (_, index) => ({
      uid: `uid-${index}`,
      email: `user-${index}@example.com`,
    }));
    mocks.getWalletEmailRecipients.mockResolvedValue(recipients);
    mocks.generateAppleWalletPasses.mockImplementation(async (_id, uids: string[]) => ({
      generated: uids.length,
      failed: [],
    }));

    renderSection(true);
    fireEvent.click(screen.getByRole("button", { name: "Generate / regenerate Apple passes" }));
    fireEvent.click(await screen.findByRole("button", { name: "Generate passes" }));

    await waitFor(() => expect(mocks.generateAppleWalletPasses).toHaveBeenCalledTimes(2));
    expect(mocks.generateAppleWalletPasses.mock.calls[0]).toEqual([
      "HackCamp2099",
      recipients.slice(0, 25).map((recipient) => recipient.uid),
    ]);
    expect(mocks.generateAppleWalletPasses.mock.calls[1]).toEqual([
      "HackCamp2099",
      recipients.slice(25).map((recipient) => recipient.uid),
    ]);
    expect(await screen.findByText(/30 of 30 processed · 30 generated/)).toBeTruthy();
  });

  it("explains a generic internal callable error instead of only showing the raw code", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getWalletEmailRecipients.mockResolvedValue([{ uid: "uid-0" }]);
    mocks.generateAppleWalletPasses.mockRejectedValue(
      Object.assign(new Error("internal"), { code: "internal" }),
    );

    renderSection(true);
    fireEvent.click(screen.getByRole("button", { name: "Generate / regenerate Apple passes" }));
    fireEvent.click(await screen.findByRole("button", { name: "Generate passes" }));

    expect(await screen.findByText(/confirm generateAppleWalletPasses is deployed/i)).toBeTruthy();
    expect(mocks.toastError).toHaveBeenCalledWith(
      expect.stringContaining("generateAppleWalletPasses is deployed"),
    );
    expect(await screen.findByText(/Stopped after 0 of 1 processed/)).toBeTruthy();
    consoleError.mockRestore();
  });
});
