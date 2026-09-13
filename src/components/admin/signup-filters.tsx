import { ChevronDown, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { COLLEGE_OPTIONS, YEAR_OPTIONS } from "@/lib/signups.schema";
import type { SignupRow } from "@/lib/signups.schema";
import { ANY_ROLE, NOT_SURE, TEAMS } from "@/lib/teams";

export const NO_TEAM = "No team given";
export const NO_ROLE = "No role given";

export const ROLE_TYPES = [
  "Director",
  "Associate Director",
  "Member",
  ANY_ROLE,
  NOT_SURE,
  NO_ROLE,
] as const;

export const TEAM_FILTER_OPTIONS: string[] = [...TEAMS.map((t) => t.title), NOT_SURE, NO_TEAM];

export type SignupFilters = {
  teams: string[];
  roleTypes: string[];
  roles: string[];
  years: string[];
  colleges: string[];
  /** "" = any, "yes" = emailed, "no" = not emailed */
  emailed: "" | "yes" | "no";
  search: string;
};

export const EMPTY_FILTERS: SignupFilters = {
  teams: [],
  roleTypes: [],
  roles: [],
  years: [],
  colleges: [],
  emailed: "",
  search: "",
};

export function filtersActive(f: SignupFilters): number {
  return (
    f.teams.length +
    f.roleTypes.length +
    f.roles.length +
    f.years.length +
    f.colleges.length +
    (f.emailed ? 1 : 0) +
    (f.search.trim() ? 1 : 0)
  );
}

/** Bucket a stored role title into one of the coarse role types. */
export function roleTypeOf(role: string | null): string {
  const value = (role ?? "").trim();
  if (!value) return NO_ROLE;
  if (value === ANY_ROLE) return ANY_ROLE;
  if (value === NOT_SURE) return NOT_SURE;
  if (/associate\s+director/i.test(value)) return "Associate Director";
  if (/director/i.test(value)) return "Director";
  return "Member";
}

function teamOf(team: string | null): string {
  const value = (team ?? "").trim();
  if (!value) return NO_TEAM;
  return value;
}

export function applyFilters(rows: SignupRow[], f: SignupFilters): SignupRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.teams.length && !f.teams.includes(teamOf(r.preferred_team))) return false;
    if (f.roleTypes.length && !f.roleTypes.includes(roleTypeOf(r.preferred_role))) return false;
    if (f.roles.length && !f.roles.includes((r.preferred_role ?? "").trim())) return false;
    if (f.years.length && !f.years.includes(r.year_of_study)) return false;
    if (f.colleges.length && !f.colleges.includes(r.college ?? "")) return false;
    if (f.emailed === "yes" && !r.notified_at) return false;
    if (f.emailed === "no" && r.notified_at) return false;
    if (q) {
      const hay = `${r.full_name} ${r.email} ${r.student_id}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Unique lowercase emails of the given rows, in order. */
export function uniqueEmails(rows: SignupRow[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    const email = r.email.toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

function CheckItem({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
      <Checkbox checked={checked} onCheckedChange={onToggle} className="mt-0.5" />
      <span className="leading-snug">{label}</span>
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="mt-2 grid gap-2">{children}</div>
    </div>
  );
}

export function SignupFilterPanel({
  filters,
  onChange,
  shown,
  total,
}: {
  filters: SignupFilters;
  onChange: (next: SignupFilters) => void;
  shown: number;
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const active = filtersActive(filters);

  function toggle(key: "teams" | "roleTypes" | "roles" | "years" | "colleges", value: string) {
    const list = filters[key];
    onChange({
      ...filters,
      [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    });
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          Filter
          {active > 0 ? (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {active}
            </span>
          ) : null}
        </Button>
        <Input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search name, email or student ID"
          className="h-9 w-full max-w-xs"
        />
        <p className="text-sm text-muted-foreground">
          Showing {shown} of {total} sign-ups
        </p>
        {active > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => onChange({ ...EMPTY_FILTERS })}>
            <X className="h-4 w-4" />
            Clear all
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="grid gap-6 border-t border-border p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Group title="Team">
            {TEAM_FILTER_OPTIONS.map((t) => (
              <CheckItem
                key={t}
                label={t}
                checked={filters.teams.includes(t)}
                onToggle={() => toggle("teams", t)}
              />
            ))}
          </Group>

          <Group title="Role type">
            {ROLE_TYPES.map((t) => (
              <CheckItem
                key={t}
                label={t}
                checked={filters.roleTypes.includes(t)}
                onToggle={() => toggle("roleTypes", t)}
              />
            ))}
          </Group>

          <div className="grid gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Specific role
            </h3>
            {TEAMS.map((team) => (
              <div key={team.title} className="grid gap-2">
                <p className="text-xs font-medium text-foreground">{team.title}</p>
                {[...team.directors, ...team.members].map((r) => (
                  <CheckItem
                    key={r.title}
                    label={r.title}
                    checked={filters.roles.includes(r.title)}
                    onToggle={() => toggle("roles", r.title)}
                  />
                ))}
              </div>
            ))}
            <div className="grid gap-2">
              {[ANY_ROLE, NOT_SURE].map((r) => (
                <CheckItem
                  key={r}
                  label={r}
                  checked={filters.roles.includes(r)}
                  onToggle={() => toggle("roles", r)}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <Group title="Year of study">
              {YEAR_OPTIONS.map((y) => (
                <CheckItem
                  key={y}
                  label={y}
                  checked={filters.years.includes(y)}
                  onToggle={() => toggle("years", y)}
                />
              ))}
            </Group>
            <Group title="College">
              {COLLEGE_OPTIONS.map((c) => (
                <CheckItem
                  key={c}
                  label={c}
                  checked={filters.colleges.includes(c)}
                  onToggle={() => toggle("colleges", c)}
                />
              ))}
            </Group>
            <Group title="Alert email">
              <CheckItem
                label="Emailed"
                checked={filters.emailed === "yes"}
                onToggle={() =>
                  onChange({
                    ...filters,
                    emailed: filters.emailed === "yes" ? "" : "yes",
                  })
                }
              />
              <CheckItem
                label="Not emailed yet"
                checked={filters.emailed === "no"}
                onToggle={() =>
                  onChange({
                    ...filters,
                    emailed: filters.emailed === "no" ? "" : "no",
                  })
                }
              />
            </Group>
          </div>
        </div>
      ) : null}
    </div>
  );
}
