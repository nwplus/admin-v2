import { GradingPeriodSetting } from "@/components/features/settings/grading-period-setting";
import { useGradingPeriod } from "@/hooks/use-grading-period";
import { EvaluatorContent } from "@/routes/_auth/evaluator";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicantList } from "./applicant-list";

const mocks = vi.hoisted(() => ({
  subscribe: vi.fn(),
  update: vi.fn(),
  error: vi.fn(),
  context: {
    gradingPeriod: false as boolean | null,
    hackathon: "",
    applicants: [],
    blacklistMatches: [],
  },
}));
vi.mock("@/services/grading-period", () => ({
  subscribeToGradingPeriod: mocks.subscribe,
  updateGradingPeriod: mocks.update,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: mocks.error } }));
vi.mock("@/lib/firebase/firestore", () => ({ subscribeToHackathons: () => () => {} }));
vi.mock("@/providers/evaluator-provider", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
  useEvaluator: () => mocks.context,
}));
vi.mock("./applicant-response", () => ({ ApplicantResponse: () => <div>Responses</div> }));
vi.mock("./applicant-scoring", () => ({ ApplicantScoring: () => <div>Scoring</div> }));
vi.mock("./settings-dialog", () => ({
  SettingsDialog: ({ open }: { open: boolean }) => (open ? <div>Settings dialog</div> : null),
}));
vi.mock("./calculate-dialog", () => ({
  CalculateDialog: () => <button type="button">Calculate Z-Score</button>,
}));
vi.mock("./accept-dialog", () => ({
  AcceptDialog: () => <button type="button">Accept Hackers</button>,
}));
vi.mock("./export-dialog", () => ({ ExportDialog: () => <button type="button">Export</button> }));
vi.mock("./blacklist-section", () => ({ BlacklistSection: () => null }));
vi.mock("@/components/ui/multi-select", () => ({ MultiSelect: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.context.gradingPeriod = false;
  mocks.update.mockResolvedValue(undefined);
  mocks.subscribe.mockImplementation((_id, onChange) => {
    onChange(false);
    return vi.fn();
  });
});
afterEach(cleanup);

describe("grading controls", () => {
  it("hides all three controls during grading and unmounts an open settings dialog", () => {
    const view = render(<EvaluatorContent />);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.queryByText("Settings dialog")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Accept Hackers" })).not.toBeNull();
    mocks.context.gradingPeriod = true;
    view.rerender(<EvaluatorContent />);
    for (const name of ["Settings", "Accept Hackers", "Calculate Z-Score"]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
    expect(screen.queryByText("Settings dialog")).toBeNull();
    expect(screen.queryByText("Scoring")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Export" })).not.toBeNull();
  });

  it("keeps destructive controls hidden while configuration is unknown", () => {
    mocks.context.gradingPeriod = null;
    render(<ApplicantList />);
    expect(screen.queryByRole("button", { name: "Accept Hackers" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Calculate Z-Score" })).toBeNull();
  });

  it("saves the settings toggle for the specific event and recovers from failed writes", async () => {
    mocks.update.mockRejectedValueOnce(new Error("offline"));
    render(<GradingPeriodSetting hackathonId="HackCamp2026" />);
    const toggle = screen.getByRole("switch", { name: "Grading period" });
    fireEvent.click(toggle);
    await waitFor(() => expect(mocks.error).toHaveBeenCalled());
    expect(mocks.update).toHaveBeenCalledWith("HackCamp2026", true);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(toggle);
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(2));
  });

  it("subscribes live, clears old event state, and cleans up on event change", () => {
    const listeners: ((enabled: boolean) => void)[] = [];
    const cleanupSubscription = vi.fn();
    mocks.subscribe.mockImplementation((_id, onChange) => {
      listeners.push(onChange);
      return cleanupSubscription;
    });
    function Probe({ id }: { id: string }) {
      const { enabled, error } = useGradingPeriod(id);
      return <div>{error ? "error" : String(enabled)}</div>;
    }
    const view = render(<Probe id="HackCamp2026" />);
    expect(screen.queryByText("null")).not.toBeNull();
    act(() => listeners[0](false));
    expect(screen.queryByText("false")).not.toBeNull();
    act(() => listeners[0](true));
    expect(screen.queryByText("true")).not.toBeNull();
    view.rerender(<Probe id="nwHacks2026" />);
    expect(screen.queryByText("null")).not.toBeNull();
    expect(cleanupSubscription).toHaveBeenCalledTimes(1);
    view.rerender(<Probe id="HackCamp2026" />);
    expect(screen.queryByText("null")).not.toBeNull();
    act(() => listeners[2](false));
    expect(screen.queryByText("false")).not.toBeNull();
    view.unmount();
    expect(cleanupSubscription).toHaveBeenCalledTimes(3);
    expect(mocks.subscribe).toHaveBeenCalledWith(
      "nwHacks2026",
      expect.any(Function),
      expect.any(Function),
    );
  });
});
