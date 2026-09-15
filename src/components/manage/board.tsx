import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { STATUSES, type PmTask, type TaskStatus } from "@/lib/pm/permissions";
import { Avatar } from "./avatar";
import { PriorityIcon, TypeIcon } from "./badges";
import { formatDate } from "./fields";
import { cn } from "@/lib/utils";

type Columns = Record<TaskStatus, string[]>;

function buildColumns(tasks: PmTask[]): Columns {
  const cols: Columns = { backlog: [], todo: [], in_progress: [], in_review: [], done: [] };
  for (const t of [...tasks].sort((a, b) => a.position - b.position)) cols[t.status].push(t.id);
  return cols;
}

type BoardProps = {
  tasks: PmTask[];
  canEdit: (task: PmTask) => boolean;
  canCreate: boolean;
  onMove: (id: string, status: TaskStatus, order: string[]) => void;
  onOpen: (id: string) => void;
  onCreate: (status: TaskStatus) => void;
};

/** Kanban board with drag-and-drop between and within columns. */
export function Board({ tasks, canEdit, canCreate, onMove, onOpen, onCreate }: BoardProps) {
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const [columns, setColumns] = useState<Columns>(() => buildColumns(tasks));
  const [activeId, setActiveId] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setColumns(buildColumns(tasks));
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function findColumn(id: string | number): TaskStatus | undefined {
    const key = String(id);
    if ((STATUSES as { key: string }[]).some((s) => s.key === key)) return key as TaskStatus;
    return (Object.keys(columns) as TaskStatus[]).find((c) => columns[c].includes(key));
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const from = findColumn(active.id);
    const to = findColumn(over.id);
    if (!from || !to || from === to) return;
    setColumns((prev) => {
      const fromIds = prev[from].filter((x) => x !== String(active.id));
      const toIds = [...prev[to]];
      const overIndex = toIds.indexOf(String(over.id));
      toIds.splice(overIndex >= 0 ? overIndex : toIds.length, 0, String(active.id));
      return { ...prev, [from]: fromIds, [to]: toIds };
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) {
      setColumns(buildColumns(tasks));
      return;
    }
    const col = findColumn(over.id) ?? findColumn(active.id);
    if (!col) return;
    setColumns((prev) => {
      const ids = [...prev[col]];
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = String(over.id) === col ? ids.length - 1 : ids.indexOf(String(over.id));
      const next =
        oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex
          ? arrayMove(ids, oldIndex, newIndex)
          : ids;
      onMove(String(active.id), col, next);
      return { ...prev, [col]: next };
    });
  }

  const activeTask = activeId ? byId.get(activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setColumns(buildColumns(tasks));
      }}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => {
          const ids = columns[status.key].filter((id) => byId.has(id));
          return (
            <Column
              key={status.key}
              status={status.key}
              label={status.label}
              hue={status.hue}
              count={ids.length}
              canCreate={canCreate}
              onCreate={() => onCreate(status.key)}
            >
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                {ids.map((id) => {
                  const task = byId.get(id)!;
                  return (
                    <SortableCard
                      key={id}
                      task={task}
                      today={today}
                      disabled={!canEdit(task)}
                      dragging={activeId === id}
                      onOpen={() => onOpen(id)}
                    />
                  );
                })}
              </SortableContext>
            </Column>
          );
        })}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
        {activeTask ? (
          <div className="rotate-2 scale-[1.03] shadow-2xl shadow-violet-900/20">
            <Card task={activeTask} today={today} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  status,
  label,
  hue,
  count,
  canCreate,
  onCreate,
  children,
}: {
  status: TaskStatus;
  label: string;
  hue: string;
  count: number;
  canCreate: boolean;
  onCreate: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hue }} />
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="rounded-full bg-black/5 px-1.5 font-mono text-[11px] text-muted-foreground">
          {count}
        </span>
        {canCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="ml-auto grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-black/5 hover:text-foreground"
            aria-label={`Add task to ${label}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "board-column flex min-h-[60vh] flex-1 flex-col gap-2 rounded-2xl bg-black/[0.035] p-2 transition-colors",
          isOver && "is-over",
        )}
      >
        {children}
        {count === 0 ? (
          <p className="m-auto py-8 text-center text-xs text-muted-foreground">Drop tasks here</p>
        ) : null}
      </div>
    </div>
  );
}

function SortableCard({
  task,
  today,
  disabled,
  dragging,
  onOpen,
}: {
  task: PmTask;
  today: string;
  disabled: boolean;
  dragging: boolean;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    disabled,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: dragging ? 0.35 : 1, y: 0 }}
      transition={{ duration: 0.2 }}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={cn(
        "outline-none",
        disabled ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
      )}
    >
      <Card task={task} today={today} />
    </motion.div>
  );
}

function Card({ task, today }: { task: PmTask; today: string }) {
  const overdue = task.due_date && task.due_date < today && task.status !== "done";
  return (
    <div className="rounded-xl border border-black/8 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-2">
        <TypeIcon type={task.type} size="xs" className="mt-0.5" />
        <p className="min-w-0 flex-1 text-sm leading-snug font-medium">{task.title}</p>
      </div>
      {task.labels.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((l) => (
            <span
              key={l}
              className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
            >
              {l}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">{task.key}</span>
        <PriorityIcon priority={task.priority} />
        {task.due_date ? (
          <span
            className={cn(
              "text-[11px]",
              overdue ? "font-semibold text-destructive" : "text-muted-foreground",
            )}
          >
            {formatDate(task.due_date)}
          </span>
        ) : null}
        <span className="ml-auto">
          <Avatar user={task.assignee} size="xs" />
        </span>
      </div>
    </div>
  );
}
