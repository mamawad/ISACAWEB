/**
 * Shared (client-safe) model for the /manage workspace: permission catalogue,
 * task vocabularies, and the row shapes server functions hand to the UI.
 */

export const PERMISSIONS = [
  {
    key: "projects.view_all",
    group: "Projects",
    label: "See every project",
    description: "Browse all projects, not only the ones they are a member of.",
  },
  {
    key: "projects.create",
    group: "Projects",
    label: "Create projects",
    description: "Start new projects. The creator becomes the project lead.",
  },
  {
    key: "projects.manage",
    group: "Projects",
    label: "Manage any project",
    description: "Edit settings, members and archive status of any project.",
  },
  {
    key: "tasks.create",
    group: "Tasks",
    label: "Create tasks",
    description: "Add tasks in projects they can see.",
  },
  {
    key: "tasks.edit_own",
    group: "Tasks",
    label: "Edit own tasks",
    description: "Edit tasks they reported or are assigned to.",
  },
  {
    key: "tasks.edit_any",
    group: "Tasks",
    label: "Edit any task",
    description: "Edit and move every task in projects they can see.",
  },
  {
    key: "tasks.delete",
    group: "Tasks",
    label: "Delete tasks",
    description: "Permanently remove tasks.",
  },
  {
    key: "files.upload",
    group: "Drive",
    label: "Upload to the drive",
    description: "Upload files and pin links in projects they can see.",
  },
  {
    key: "files.manage",
    group: "Drive",
    label: "Manage any file",
    description: "Delete files and links uploaded by others.",
  },
  {
    key: "people.view",
    group: "People",
    label: "See the people list",
    description: "View members and their roles.",
  },
  {
    key: "people.manage",
    group: "People",
    label: "Manage people",
    description: "Create accounts, set passwords, change roles, deactivate.",
  },
  {
    key: "roles.manage",
    group: "People",
    label: "Manage roles",
    description: "Create roles and choose what each one can do.",
  },
  {
    key: "people.impersonate",
    group: "People",
    label: "View as another member",
    description: "Open the workspace exactly as another member sees it.",
  },
] as const;

export type Permission = (typeof PERMISSIONS)[number]["key"];

export const PERMISSION_GROUPS = ["Projects", "Tasks", "Drive", "People"] as const;

export type ProjectAccess = "lead" | "editor" | "member" | "viewer";
export const PROJECT_ACCESS: { key: ProjectAccess; label: string; description: string }[] = [
  { key: "lead", label: "Lead", description: "Runs the project: settings, members, every task." },
  { key: "editor", label: "Editor", description: "Can edit and move every task." },
  { key: "member", label: "Member", description: "Creates tasks and edits their own." },
  { key: "viewer", label: "Viewer", description: "Read-only." },
];

export type TaskStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = "lowest" | "low" | "medium" | "high" | "highest";
export type TaskType = "epic" | "story" | "task" | "bug";

export const STATUSES: { key: TaskStatus; label: string; hue: string }[] = [
  { key: "backlog", label: "Backlog", hue: "oklch(0.6 0.02 290)" },
  { key: "todo", label: "To do", hue: "oklch(0.62 0.15 250)" },
  { key: "in_progress", label: "In progress", hue: "oklch(0.7 0.17 60)" },
  { key: "in_review", label: "In review", hue: "oklch(0.6 0.2 300)" },
  { key: "done", label: "Done", hue: "oklch(0.68 0.17 150)" },
];

export const PRIORITIES: { key: TaskPriority; label: string; rank: number }[] = [
  { key: "highest", label: "Highest", rank: 5 },
  { key: "high", label: "High", rank: 4 },
  { key: "medium", label: "Medium", rank: 3 },
  { key: "low", label: "Low", rank: 2 },
  { key: "lowest", label: "Lowest", rank: 1 },
];

export const TASK_TYPES: { key: TaskType; label: string }[] = [
  { key: "epic", label: "Epic" },
  { key: "story", label: "Story" },
  { key: "task", label: "Task" },
  { key: "bug", label: "Bug" },
];

export const AVATAR_COLORS = [
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#0891b2",
  "#2563eb",
  "#4f46e5",
];

export type MiniUser = {
  id: string;
  username: string;
  display_name: string;
  avatar_color: string;
};

export type PmUser = MiniUser & {
  email: string | null;
  role_id: string | null;
  role_name: string | null;
  is_admin: boolean;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
};

export type PmRole = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  created_at: string;
  user_count: number;
};

export type PmProject = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  color: string;
  lead_id: string | null;
  lead: MiniUser | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  member_count: number;
  open_tasks: number;
  done_tasks: number;
  my_access: ProjectAccess | null;
};

export type PmMember = {
  user_id: string;
  access: ProjectAccess;
  added_at: string;
  user: MiniUser & { role_name: string | null; is_active: boolean };
};

export type PmTask = {
  id: string;
  project_id: string;
  project_key: string;
  number: number;
  key: string;
  type: TaskType;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  reporter_id: string | null;
  parent_id: string | null;
  labels: string[];
  start_date: string | null;
  due_date: string | null;
  estimate_hours: number | null;
  position: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  assignee: MiniUser | null;
  reporter: MiniUser | null;
  parent: { id: string; key: string; title: string } | null;
};

export type PmComment = {
  id: string;
  task_id: string;
  user_id: string | null;
  body: string;
  created_at: string;
  user: MiniUser | null;
};

export type PmActivity = {
  id: string;
  project_id: string | null;
  task_id: string | null;
  user_id: string | null;
  action: string;
  meta: Record<string, string | number | boolean | null | string[]>;
  created_at: string;
  user: MiniUser | null;
  task: { id: string; key: string; title: string } | null;
  project_key: string | null;
};

export type PmFile = {
  id: string;
  project_id: string;
  task_id: string | null;
  kind: "file" | "link";
  name: string;
  storage_path: string | null;
  url: string | null;
  size: number | null;
  mime: string | null;
  uploaded_by: string | null;
  created_at: string;
  uploader: MiniUser | null;
};

/** What the layout learns about the signed-in user. */
export type ManageContext = {
  user: PmUser;
  permissions: string[];
  impersonator: MiniUser | null;
};

/** Per-project effective rights for the current user. */
export type ProjectRights = {
  access: ProjectAccess | null;
  canView: boolean;
  canManage: boolean;
  canEditAny: boolean;
  canCreate: boolean;
  canUpload: boolean;
};

export function hasPermission(
  ctx: { user: { is_admin: boolean }; permissions: string[] },
  perm: Permission,
): boolean {
  return ctx.user.is_admin || ctx.permissions.includes("*") || ctx.permissions.includes(perm);
}

/** Effective project rights from role permissions + project membership. */
export function projectRights(
  ctx: { user: { is_admin: boolean }; permissions: string[] },
  access: ProjectAccess | null,
): ProjectRights {
  const admin = ctx.user.is_admin || ctx.permissions.includes("*");
  const canView = admin || hasPermission(ctx, "projects.view_all") || access !== null;
  const canManage = admin || hasPermission(ctx, "projects.manage") || access === "lead";
  const canEditAny = canManage || hasPermission(ctx, "tasks.edit_any") || access === "editor";
  // Leads and editors are covered by canEditAny; members get the base rights.
  const canCreate =
    canView && (canEditAny || hasPermission(ctx, "tasks.create") || access === "member");
  const canUpload =
    canView && (canEditAny || hasPermission(ctx, "files.upload") || access === "member");
  return { access, canView, canManage, canEditAny, canCreate, canUpload };
}

export function canEditTask(
  ctx: { user: { id: string; is_admin: boolean }; permissions: string[] },
  rights: ProjectRights,
  task: { assignee_id: string | null; reporter_id: string | null },
): boolean {
  if (rights.canEditAny) return true;
  if (!rights.canView) return false;
  const own = task.assignee_id === ctx.user.id || task.reporter_id === ctx.user.id;
  return own && (hasPermission(ctx, "tasks.edit_own") || rights.access === "member");
}

export function taskKey(projectKey: string, number: number): string {
  return `${projectKey}-${number}`;
}

export function statusMeta(status: TaskStatus) {
  return STATUSES.find((s) => s.key === status) ?? STATUSES[1]!;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}
