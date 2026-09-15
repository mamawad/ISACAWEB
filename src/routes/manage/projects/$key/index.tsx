import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KanbanSquare } from "lucide-react";
import { toast } from "sonner";
import { listProjectTasks, moveTask } from "@/lib/pm/tasks.functions";
import { canEditTask, type PmTask, type TaskStatus } from "@/lib/pm/permissions";
import { useManage } from "@/components/manage/manage-context";
import { useProject } from "@/components/manage/project-context";
import { Board } from "@/components/manage/board";
import { FilterBar } from "@/components/manage/filter-bar";
import { useTaskFilter } from "@/components/manage/task-filters";
import { EmptyState } from "@/components/manage/shell";
import { errorMessage } from "@/components/manage/fields";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/manage/projects/$key/")({
  component: BoardPage,
});

function BoardPage() {
  const ctx = useManage();
  const { project, people, rights, openTask, openCreate } = useProject();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["pm", "tasks", project.id],
    queryFn: () => listProjectTasks({ data: { project_id: project.id } }),
  });
  const tasks = query.data?.tasks ?? [];
  const { filter, setFilter, filtered, active, reset } = useTaskFilter(tasks, ctx.user.id);

  const move = useMutation({
    mutationFn: (v: { id: string; status: TaskStatus; order: string[] }) => moveTask({ data: v }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["pm", "tasks", project.id] });
      const prev = qc.getQueryData<typeof query.data>(["pm", "tasks", project.id]);
      if (prev) {
        const pos = new Map(v.order.map((id, i) => [id, (i + 1) * 1000]));
        qc.setQueryData(["pm", "tasks", project.id], {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === v.id
              ? { ...t, status: v.status, position: pos.get(t.id) ?? t.position }
              : pos.has(t.id)
                ? { ...t, position: pos.get(t.id)! }
                : t,
          ),
        });
      }
      return { prev };
    },
    onError: (err, _v, snapshot) => {
      if (snapshot?.prev) qc.setQueryData(["pm", "tasks", project.id], snapshot.prev);
      toast.error("Could not move task", { description: errorMessage(err) });
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["pm", "tasks", project.id] });
      void qc.invalidateQueries({ queryKey: ["pm", "project", project.key] });
      void qc.invalidateQueries({ queryKey: ["pm", "dashboard"] });
    },
  });

  if (query.isLoading) {
    return (
      <div className="flex gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[60vh] w-72 shrink-0 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <FilterBar
        filter={filter}
        setFilter={setFilter}
        people={people}
        active={active}
        reset={reset}
      />
      {tasks.length === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title="The board is empty"
          description={
            rights.canCreate
              ? "Create the first task and drag it across as work moves."
              : "No tasks have been created yet."
          }
          action={
            rights.canCreate ? (
              <button type="button" onClick={() => openCreate()} className="btn btn-primary btn-sm">
                <span className="relative">Create task</span>
              </button>
            ) : undefined
          }
        />
      ) : (
        <Board
          tasks={filtered}
          canEdit={(t: PmTask) => canEditTask(ctx, rights, t) && !project.is_archived}
          canCreate={rights.canCreate && !project.is_archived}
          onMove={(id, status, order) => move.mutate({ id, status, order })}
          onOpen={openTask}
          onCreate={(status) => openCreate({ status })}
        />
      )}
    </>
  );
}
