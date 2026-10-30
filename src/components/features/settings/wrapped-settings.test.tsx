import { uploadWrappedBanner } from "@/lib/firebase/storage";
import {
  type WrappedSettings as WrappedSettingsData,
  subscribeToWrappedSettings,
  updateWrappedSettings,
} from "@/services/wrapped-email";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WrappedSettings } from "./wrapped-settings";

// No Firebase client, Storage, or Firestore writes are loaded by this test.
vi.mock("@/services/wrapped-email", () => ({
  getDefaultWrappedUrl: (id: string) => `https://portal.example.invalid/${id}/wrapped`,
  subscribeToWrappedSettings: vi.fn(),
  updateWrappedSettings: vi.fn(),
}));
vi.mock("@/lib/firebase/storage", () => ({ uploadWrappedBanner: vi.fn() }));
vi.mock("./wrapped-email-control", () => ({
  WrappedEmailControl: ({ disabled }: { disabled?: boolean }) => (
    <p>{disabled ? "email control disabled" : "email control enabled"}</p>
  ),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let publish: (settings: WrappedSettingsData) => void;
const saved = { isReady: false, bannerUrl: "https://example.invalid/old.png" };
const released = () => screen.getByRole("switch", { name: "Released" });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(subscribeToWrappedSettings).mockImplementation((_id, onChange) => {
    publish = onChange;
    return vi.fn();
  });
  vi.mocked(updateWrappedSettings).mockResolvedValue(undefined);
  vi.mocked(uploadWrappedBanner).mockResolvedValue("https://example.invalid/new.png");
});
afterEach(cleanup);

const renderLoaded = (settings: WrappedSettingsData = saved) => {
  const view = render(<WrappedSettings hackathonId="HackCamp2099" />);
  act(() => publish(settings));
  return view;
};

describe("WrappedSettings", () => {
  it("saves only the changed link override", async () => {
    renderLoaded();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Wrapped Link Override"), {
      target: { value: " https://example.invalid/wrapped " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(updateWrappedSettings).toHaveBeenCalledExactlyOnceWith("HackCamp2099", {
        url: "https://example.invalid/wrapped",
      }),
    );
    expect(uploadWrappedBanner).not.toHaveBeenCalled();
  });

  it("removes a cleared link override", async () => {
    renderLoaded({ ...saved, url: "https://example.invalid/wrapped" });
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Wrapped Link Override"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(updateWrappedSettings).toHaveBeenCalledExactlyOnceWith("HackCamp2099", { url: null }),
    );
  });

  it("confirms before releasing Wrapped to hackers", async () => {
    renderLoaded();
    expect((released() as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    fireEvent.click(released());
    expect(screen.getByRole("heading", { name: "Release Hacker Wrapped?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(released().getAttribute("aria-checked")).toBe("false");

    fireEvent.click(released());
    fireEvent.click(screen.getByRole("button", { name: "Release" }));
    expect(released().getAttribute("aria-checked")).toBe("true");
    expect(updateWrappedSettings).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(updateWrappedSettings).toHaveBeenCalledExactlyOnceWith("HackCamp2099", {
        isReady: true,
      }),
    );
  });

  it("turns Wrapped off without confirmation", async () => {
    renderLoaded({ ...saved, isReady: true });
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(released());
    expect(screen.queryByRole("heading", { name: "Release Hacker Wrapped?" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(updateWrappedSettings).toHaveBeenCalledExactlyOnceWith("HackCamp2099", {
        isReady: false,
      }),
    );
  });

  it("uploads a new banner on save and stores only its url", async () => {
    renderLoaded();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const banner = new File(["png"], "banner.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Email Banner"), { target: { files: [banner] } });
    expect(uploadWrappedBanner).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(updateWrappedSettings).toHaveBeenCalledExactlyOnceWith("HackCamp2099", {
        bannerUrl: "https://example.invalid/new.png",
      }),
    );
    expect(uploadWrappedBanner).toHaveBeenCalledExactlyOnceWith("HackCamp2099", banner);
  });

  it("rejects banners that are not PNG or JPEG", () => {
    renderLoaded();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const gif = new File(["gif"], "banner.gif", { type: "image/gif" });
    fireEvent.change(screen.getByLabelText("Email Banner"), { target: { files: [gif] } });
    expect(screen.getByText("The banner must be a PNG or JPEG image.")).toBeTruthy();
  });

  it("disables sending while this section or the main form is being edited", () => {
    const view = renderLoaded();
    expect(screen.getByText("email control enabled")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("email control disabled")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("email control enabled")).toBeTruthy();
    view.rerender(<WrappedSettings hackathonId="HackCamp2099" formBusy />);
    expect(screen.getByText("email control disabled")).toBeTruthy();
  });
});
