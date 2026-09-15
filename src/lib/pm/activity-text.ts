import type { PmActivity } from "./permissions";
import { PRIORITIES, STATUSES } from "./permissions";

function pretty(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "none";
  if (field === "status") return STATUSES.find((s) => s.key === value)?.label ?? String(value);
  if (field === "priority") return PRIORITIES.find((p) => p.key === value)?.label ?? String(value);
  if (Array.isArray(value)) return value.length ? value.join(", ") : "none";
  return String(value);
}

/** Human sentence for an activity row, without the actor's name. */
export function describeActivity(a: PmActivity): string {
  const m = a.meta as Record<string, unknown>;
  const key = a.task?.key ? `${a.task.key} ` : "";
  switch (a.action) {
    case "workspace.bootstrapped":
      return "set up the workspace";
    case "task.created":
      return `created ${key}"${String(m["title"] ?? "")}"`;
    case "task.deleted":
      return `deleted ${String(m["key"] ?? "a task")}`;
    case "task.commented":
      return `commented on ${key}`.trim();
    case "task.status":
      return `moved ${key}from ${pretty("status", m["from"])} to ${pretty("status", m["to"])}`;
    case "task.assignee_id":
      return `changed the assignee of ${key}`.trim();
    case "task.priority":
      return `set ${key}priority to ${pretty("priority", m["to"])}`;
    case "task.due_date":
      return `set ${key}due date to ${pretty("due_date", m["to"])}`;
    case "task.start_date":
      return `set ${key}start date to ${pretty("start_date", m["to"])}`;
    case "task.title":
      return `renamed ${key}`.trim();
    case "task.description":
      return `updated the description of ${key}`.trim();
    case "task.labels":
      return `changed labels on ${key}`.trim();
    case "task.type":
      return `changed ${key}to a ${pretty("type", m["to"])}`;
    case "task.parent_id":
      return `moved ${key}under a different epic`;
    case "task.estimate_hours":
      return `updated the estimate on ${key}`.trim();
    case "project.created":
      return `created the project ${String(m["name"] ?? "")}`;
    case "project.updated":
      return "updated project settings";
    case "project.archived":
      return "archived the project";
    case "project.restored":
      return "restored the project";
    case "project.deleted":
      return `deleted the project ${String(m["name"] ?? "")}`;
    case "project.member_set":
      return `set ${String(m["target"] ?? "a member")} as ${String(m["access"] ?? "member")}`;
    case "project.member_removed":
      return `removed ${String(m["target"] ?? "a member")} from the project`;
    case "file.uploaded":
      return `uploaded ${String(m["name"] ?? "a file")}`;
    case "file.linked":
      return `pinned the link ${String(m["name"] ?? "")}`;
    case "file.deleted":
      return `deleted ${String(m["name"] ?? "a file")}`;
    case "people.created":
      return `added ${String(m["display_name"] ?? "a member")}`;
    case "people.updated":
      return `updated ${String(m["target"] ?? "a member")}`;
    case "people.password_reset":
      return `reset the password for ${String(m["target"] ?? "a member")}`;
    case "people.deleted":
      return `removed ${String(m["target"] ?? "a member")}`;
    case "people.impersonated":
      return `viewed the workspace as ${String(m["target"] ?? "a member")}`;
    case "roles.created":
      return `created the role ${String(m["role"] ?? "")}`;
    case "roles.updated":
      return `updated the role ${String(m["role"] ?? "")}`;
    case "roles.deleted":
      return `deleted the role ${String(m["role"] ?? "")}`;
    default:
      return a.action.replace(/[._]/g, " ");
  }
}
