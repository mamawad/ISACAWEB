import { Search, X } from "lucide-react";
import { PRIORITIES, STATUSES, TASK_TYPES, type MiniUser } from "@/lib/pm/permissions";
import type { TaskFilter } from "./task-filters";
import { SelectField } from "./fields";
import { cn } from "@/lib/utils";

export function FilterBar({
  filter,
  setFilter,
  people,
  active,
  reset,
  showStatus = false,
}: {
  filter: TaskFilter;
  setFilter: (f: TaskFilter) => void;
  people: MiniUser[];
  active: boolean;
  reset: () => void;
  showStatus?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <label className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-9 w-56 rounded-lg border border-input bg-white pl-9 pr-3 text-sm shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          value={filter.q}
          onChange={(e) => setFilter({ ...filter, q: e.target.value })}
        />
      </label>
      <SelectField
        className="h-9 w-40"
        value={filter.assignee}
        onChange={(v) => setFilter({ ...filter, assignee: v })}
        allowEmpty="Any assignee"
        options={[
          { value: "none", label: "Unassigned" },
          ...people.map((p) => ({ value: p.id, label: p.display_name })),
        ]}
      />
      <SelectField
        className="h-9 w-32"
        value={filter.type}
        onChange={(v) => setFilter({ ...filter, type: v })}
        allowEmpty="Any type"
        options={TASK_TYPES.map((t) => ({ value: t.key, label: t.label }))}
      />
      <SelectField
        className="h-9 w-36"
        value={filter.priority}
        onChange={(v) => setFilter({ ...filter, priority: v })}
        allowEmpty="Any priority"
        options={PRIORITIES.map((p) => ({ value: p.key, label: p.label }))}
      />
      {showStatus ? (
        <SelectField
          className="h-9 w-36"
          value={filter.status}
          onChange={(v) => setFilter({ ...filter, status: v })}
          allowEmpty="Any status"
          options={STATUSES.map((s) => ({ value: s.key, label: s.label }))}
        />
      ) : null}
      <button
        type="button"
        onClick={() => setFilter({ ...filter, mine: !filter.mine })}
        className={cn(
          "h-9 rounded-lg border px-3 text-sm font-medium transition-colors",
          filter.mine
            ? "border-primary bg-primary/10 text-primary"
            : "border-input bg-white text-muted-foreground hover:text-foreground",
        )}
      >
        Only mine
      </button>
      {active ? (
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-9 items-center gap-1 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      ) : null}
    </div>
  );
}
