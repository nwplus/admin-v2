import type { HackathonConfig } from "@/lib/firebase/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HackathonSettingsForm } from "./hackathon-settings-form";

const settings = vi.hoisted(() => ({
  config: null as unknown as HackathonConfig,
  updateHackathonConfig: vi.fn(),
}));

vi.mock("@/services/hackathon-settings", () => ({
  subscribeToHackathonConfig: (callback: (data: HackathonConfig) => void) => {
    callback(settings.config);
    return () => {};
  },
  updateHackathonConfig: settings.updateHackathonConfig,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const timeline = {
  hackathonStart: { hackcamp: "2026-11-07T17:00:00.000Z" },
  hackathonEnd: { hackcamp: "2026-11-08T23:00:00.000Z" },
  hackingStart: { hackcamp: "2026-11-07T19:00:00.000Z" },
  hackingEnd: { hackcamp: "2026-11-08T19:00:00.000Z" },
};

const toggleCtfAndSave = async () => {
  render(<HackathonSettingsForm hackathonId="HackCamp2026" />);
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  fireEvent.click(screen.getByRole("switch", { name: "CTF Open" }));
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(settings.updateHackathonConfig).toHaveBeenCalledOnce());
  return settings.updateHackathonConfig.mock.calls[0][0] as HackathonConfig;
};

describe("HackathonSettingsForm CTF Open", () => {
  beforeEach(() => {
    settings.updateHackathonConfig.mockReset();
  });

  it("creates the ctfOpen map when the doc doesn't have one yet", async () => {
    settings.config = {
      ...timeline,
      portalLive: { hackcamp: false },
    } as unknown as HackathonConfig;

    const saved = await toggleCtfAndSave();

    expect(saved.ctfOpen).toEqual({ hackcamp: true });
    expect(saved.portalLive).toEqual({ hackcamp: false });
  });

  it("only changes this hackathon's flag", async () => {
    settings.config = {
      ...timeline,
      ctfOpen: { hackcamp: false, nwhacks: true },
    } as unknown as HackathonConfig;

    const saved = await toggleCtfAndSave();

    expect(saved.ctfOpen).toEqual({ hackcamp: true, nwhacks: true });
  });
});
