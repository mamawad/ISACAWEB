import { useEffect, useState } from "react";
import { isNationalDaySeason, isNationalDayToday } from "@/lib/national-day";

/**
 * Whether the National Day theme is on. Evaluated identically on server and
 * client at render time; a mid-session date change is picked up after mount.
 */
export function useNationalDay(): { active: boolean; today: boolean } {
  const [state, setState] = useState(() => ({
    active: isNationalDaySeason(),
    today: isNationalDayToday(),
  }));
  useEffect(() => {
    const t = window.setInterval(
      () => setState({ active: isNationalDaySeason(), today: isNationalDayToday() }),
      10 * 60_000,
    );
    return () => window.clearInterval(t);
  }, []);
  return state;
}
