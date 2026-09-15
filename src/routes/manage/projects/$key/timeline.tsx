import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listProjectTasks, updateTask } from "@/lib/pm/tasks.functions";
import { canEditTask } from "@/lib/pm/permissions";
import { useManage } from "@/components/manage/manage-context";
import { useProject } from "@/components/manage/project-context";
import { Timeline } from "@/components/manage/timeline";
import { FilterBar } from "@/components/manage/filter-bar";
import { useTaskFilter } from "@/components/manage/task-filters";
import { errorMessage } from "@/components/manage/fields";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/manage/projects/$key/timeline")({
  component: TimelinePage,
});

function TimelinePage() {
  const ctx = useManage();
  const { project, people, rights, openTask } = useProject();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["pm", "tasks", project.id],
    queryFn: () => listProjectTasks({ data: { project_id: project.id } }),
  });
  const tasks = query.data?.tasks ?? [];
  const { filter, setFilter, filtered, active, reset } = useTaskFilter(tasks, ctx.user.id);

  const reschedule = useMutation({
    mutationFn: (v: { id: string; start_date: string; due_date: string }) =>
      updateTask({ data: v }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["pm", "tasks", project.id] });
      const prev = qc.getQueryData<typeof query.data>(["pm", "tasks", project.id]);
      if (prev) {
        qc.setQueryData(["pm", "tasks", project.id], {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === v.id ? { ...t, start_date: v.start_date, due_date: v.due_date } : t,
          ),
        });
      }
      return { prev };
    },
    onError: (err, _v, snapshot) => {
      if (snapshot?.prev) qc.setQueryData(["pm", "tasks", project.id], snapshot.prev);
      toast.error("Could not reschedule", { description: errorMessage(err) });
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["pm", "tasks", project.id] });
      void qc.invalidateQueries({ queryKey: ["pm", "dashboard"] });
    },
  });

  if (query.isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <>
      <FilterBar
        filter={filter}
        setFilter={setFilter}
        people={people}
        active={active}
        reset={reset}
        showStatus
      />
      <Timeline
        tasks={filtered}
        canEdit={(t) => canEditTask(ctx, rights, t) && !project.is_archived}
        onChangeDates={(id, start_date, due_date) =>
          reschedule.mutate({ id, start_date, due_date })
        }
        onOpen={openTask}
      />
    </>
  );
}
