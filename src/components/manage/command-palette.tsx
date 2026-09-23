import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CheckSquare2,
  FolderKanban,
  LayoutDashboard,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { listProjects } from "@/lib/pm/projects.functions";
import { listMyTasks } from "@/lib/pm/tasks.functions";
import { useCan } from "./manage-context";
import { TypeIcon } from "./badges";

/** Ctrl/⌘+K jump-anywhere. */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const can = useCan();
  const [query, setQuery] = useState("");

  const projects = useQuery({
    queryKey: ["pm", "projects", false],
    queryFn: () => listProjects({ data: {} }),
    enabled: open,
    staleTime: 30_000,
  });
  const tasks = useQuery({
    queryKey: ["pm", "my-tasks"],
    queryFn: () => listMyTasks(),
    enabled: open,
    staleTime: 30_000,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  function go(fn: () => void) {
    onOpenChange(false);
    setQuery("");
    fn();
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        aria-label="Search pages, projects and tasks"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Nothing matches.</CommandEmpty>
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => go(() => navigate({ to: "/manage" }))}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/manage/tasks" }))}>
            <CheckSquare2 className="mr-2 h-4 w-4" /> My work
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/manage/projects" }))}>
            <FolderKanban className="mr-2 h-4 w-4" /> Projects
          </CommandItem>
          {can("people.view") ? (
            <CommandItem onSelect={() => go(() => navigate({ to: "/manage/people" }))}>
              <Users className="mr-2 h-4 w-4" /> People
            </CommandItem>
          ) : null}
          {can("roles.manage") ? (
            <CommandItem onSelect={() => go(() => navigate({ to: "/manage/roles" }))}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Roles
            </CommandItem>
          ) : null}
          <CommandItem onSelect={() => go(() => navigate({ to: "/manage/profile" }))}>
            <UserRound className="mr-2 h-4 w-4" /> Profile
          </CommandItem>
        </CommandGroup>
        {projects.data?.projects.length ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.data.projects.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.key} ${p.name}`}
                  onSelect={() =>
                    go(() => navigate({ to: "/manage/projects/$key", params: { key: p.key } }))
                  }
                >
                  <span
                    className="mr-2 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{p.key}</span>
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
        {tasks.data?.tasks.length ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="My tasks">
              {tasks.data.tasks.slice(0, 30).map((t) => (
                <CommandItem
                  key={t.id}
                  value={`${t.key} ${t.title}`}
                  onSelect={() =>
                    go(() =>
                      navigate({
                        to: "/manage/projects/$key",
                        params: { key: t.project_key },
                        search: { task: t.id },
                      }),
                    )
                  }
                >
                  <TypeIcon type={t.type} size="xs" className="mr-2" />
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{t.key}</span>
                  <span className="truncate">{t.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
