import { useMemo, useState } from "react";
import type { PmTask } from "@/lib/pm/permissions";

export type TaskFilter = {
  q: string;
  assignee: string;
  type: string;
  priority: string;
  status: string;
  mine: boolean;
};

export const EMPTY_FILTER: TaskFilter = {
  q: "",
  assignee: "",
  type: "",
  priority: "",
  status: "",
  mine: false,
};

/** Shared client-side filtering for board/list/timeline. */
export function useTaskFilter(tasks: PmTask[], userId: string) {
  const [filter, setFilter] = useState<TaskFilter>(EMPTY_FILTER);
  const filtered = useMemo(() => {
    const q = filter.q.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q && !`${t.key} ${t.title} ${t.labels.join(" ")}`.toLowerCase().includes(q)) return false;
      if (
        filter.assignee === "none"
          ? t.assignee_id !== null
          : filter.assignee && t.assignee_id !== filter.assignee
      )
        return false;
      if (filter.type && t.type !== filter.type) return false;
      if (filter.priority && t.priority !== filter.priority) return false;
      if (filter.status && t.status !== filter.status) return false;
      if (filter.mine && t.assignee_id !== userId && t.reporter_id !== userId) return false;
      return true;
    });
  }, [tasks, filter, userId]);
  const active = Object.entries(filter).some(([k, v]) => (k === "mine" ? v === true : v !== ""));
  return { filter, setFilter, filtered, active, reset: () => setFilter(EMPTY_FILTER) };
}
