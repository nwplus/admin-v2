import { subscribeToGradingPeriod } from "@/services/grading-period";
import { useEffect, useState } from "react";

export function useGradingPeriod(hackathonId: string) {
  const [state, setState] = useState<{
    hackathonId: string;
    enabled: boolean | null;
    error: boolean;
  }>({ hackathonId: "", enabled: null, error: false });

  useEffect(() => {
    setState({ hackathonId, enabled: null, error: false });
    if (!hackathonId) return;
    return subscribeToGradingPeriod(
      hackathonId,
      (enabled) => setState({ hackathonId, enabled, error: false }),
      (error) => {
        console.error("Failed to load grading period:", error);
        setState({ hackathonId, enabled: null, error: true });
      },
    );
  }, [hackathonId]);

  return state.hackathonId === hackathonId
    ? { enabled: state.enabled, error: state.error }
    : { enabled: null, error: false };
}
