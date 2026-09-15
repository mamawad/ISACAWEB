import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from "date-fns";
import { motion } from "motion/react";
import { CalendarPlus, ZoomIn, ZoomOut } from "lucide-react";
import { statusMeta, type PmTask } from "@/lib/pm/permissions";
import { Avatar } from "./avatar";
import { TypeIcon } from "./badges";
import { cn } from "@/lib/utils";

type TimelineProps = {
  tasks: PmTask[];
  canEdit: (task: PmTask) => boolean;
  onChangeDates: (id: string, start: string, due: string) => void;
  onOpen: (id: string) => void;
};

const ROW_H = 44;
const LEFT_W = 272;

type Drag = {
  id: string;
  mode: "move" | "start" | "end";
  originX: number;
  start: Date;
  due: Date;
  delta: number;
};

function iso(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Gantt: one row per scheduled task, draggable bars, today marker, unscheduled list. */
export function Timeline({ tasks, canEdit, onChangeDates, onOpen }: TimelineProps) {
  const [dayWidth, setDayWidth] = useState(28);
  const [drag, setDrag] = useState<Drag | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date(new Date().toDateString()), []);

  const scheduled = useMemo(
    () =>
      tasks
        .filter((t) => t.start_date || t.due_date)
        .map((t) => {
          const start = parseISO(t.start_date ?? t.due_date!);
          const due = parseISO(t.due_date ?? t.start_date!);
          return { task: t, start: due < start ? due : start, due: due < start ? start : due };
        })
        .sort((a, b) => a.start.getTime() - b.start.getTime() || a.task.number - b.task.number),
    [tasks],
  );
  const unscheduled = useMemo(
    () => tasks.filter((t) => !t.start_date && !t.due_date && t.status !== "done"),
    [tasks],
  );

  const range = useMemo(() => {
    const starts = scheduled.map((s) => s.start.getTime());
    const ends = scheduled.map((s) => s.due.getTime());
    const min = new Date(
      Math.min(today.getTime(), ...(starts.length ? starts : [today.getTime()])),
    );
    const max = new Date(
      Math.max(addDays(today, 42).getTime(), ...(ends.length ? ends : [today.getTime()])),
    );
    const from = startOfWeek(addDays(min, -7), { weekStartsOn: 6 });
    const to = addDays(max, 21);
    return { from, days: differenceInCalendarDays(to, from) + 1 };
  }, [scheduled, today]);

  const x = (d: Date) => differenceInCalendarDays(d, range.from) * dayWidth;

  const months = useMemo(() => {
    const out: { label: string; left: number; width: number }[] = [];
    let cursor = range.from;
    const end = addDays(range.from, range.days);
    while (cursor < end) {
      const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      const stop = next < end ? next : end;
      out.push({
        label: format(cursor, "MMMM yyyy"),
        left: x(cursor),
        width: differenceInCalendarDays(stop, cursor) * dayWidth,
      });
      cursor = stop;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, dayWidth]);

  function beginDrag(
    e: ReactPointerEvent<HTMLElement>,
    item: (typeof scheduled)[number],
    mode: Drag["mode"],
  ) {
    if (!canEdit(item.task)) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({
      id: item.task.id,
      mode,
      originX: e.clientX,
      start: item.start,
      due: item.due,
      delta: 0,
    });
  }
  function onPointerMove(e: ReactPointerEvent<HTMLElement>) {
    if (!drag) return;
    const delta = Math.round((e.clientX - drag.originX) / dayWidth);
    if (delta !== drag.delta) setDrag({ ...drag, delta });
  }
  function endDrag(e: ReactPointerEvent<HTMLElement>) {
    if (!drag) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    const { start, due, delta, mode, id } = drag;
    setDrag(null);
    if (delta === 0) {
      if (mode === "move") onOpen(id);
      return;
    }
    let s = start;
    let d = due;
    if (mode === "move") {
      s = addDays(start, delta);
      d = addDays(due, delta);
    } else if (mode === "start") {
      s = addDays(start, delta);
      if (s > d) s = d;
    } else {
      d = addDays(due, delta);
      if (d < s) d = s;
    }
    onChangeDates(id, iso(s), iso(d));
  }

  function previewOf(item: (typeof scheduled)[number]) {
    if (!drag || drag.id !== item.task.id) return { start: item.start, due: item.due };
    if (drag.mode === "move")
      return { start: addDays(item.start, drag.delta), due: addDays(item.due, drag.delta) };
    if (drag.mode === "start") {
      const s = addDays(item.start, drag.delta);
      return { start: s > item.due ? item.due : s, due: item.due };
    }
    const d = addDays(item.due, drag.delta);
    return { start: item.start, due: d < item.start ? item.start : d };
  }

  const width = range.days * dayWidth;
  const height = Math.max(scheduled.length, 1) * ROW_H;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {scheduled.length} scheduled · drag a bar to move it, drag its edges to resize.
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDayWidth((w) => Math.max(10, w - 6))}
            className="grid h-8 w-8 place-items-center rounded-md hover:bg-black/5"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDayWidth((w) => Math.min(60, w + 6))}
            className="grid h-8 w-8 place-items-center rounded-md hover:bg-black/5"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              scroller.current?.scrollTo({ left: Math.max(0, x(today) - 200), behavior: "smooth" })
            }
            className="btn btn-ghost btn-sm ml-2"
          >
            Today
          </button>
        </div>
      </div>

      <div className="card-glow overflow-hidden">
        <div
          ref={scroller}
          className="overflow-x-auto"
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="relative" style={{ width: LEFT_W + width, minHeight: height + 56 }}>
            {/* Header */}
            <div className="sticky top-0 z-20 flex h-14 border-b border-black/8 bg-white/95 backdrop-blur">
              <div className="sticky left-0 z-30 w-[272px] shrink-0 border-r border-black/8 bg-white/95 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                Task
              </div>
              <div className="relative" style={{ width }}>
                {months.map((m) => (
                  <div
                    key={m.label}
                    className="absolute top-0 h-7 border-r border-black/5 px-2 text-xs font-semibold whitespace-nowrap"
                    style={{ left: m.left, width: m.width, lineHeight: "28px" }}
                  >
                    {m.label}
                  </div>
                ))}
                {Array.from({ length: range.days }).map((_, i) => {
                  const d = addDays(range.from, i);
                  const weekend = d.getDay() === 5 || d.getDay() === 6;
                  const isToday = differenceInCalendarDays(d, today) === 0;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "absolute top-7 h-7 border-r border-black/5 text-center font-mono text-[10px] leading-7",
                        weekend && "bg-black/[0.03] text-muted-foreground",
                        isToday && "font-bold text-primary",
                      )}
                      style={{ left: i * dayWidth, width: dayWidth }}
                    >
                      {dayWidth >= 18 ? format(d, "d") : d.getDay() === 6 ? format(d, "d") : ""}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            <div className="relative flex">
              <div className="sticky left-0 z-10 w-[272px] shrink-0 border-r border-black/8 bg-white">
                {scheduled.map(({ task }) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onOpen(task.id)}
                    className="flex w-full items-center gap-2 border-b border-black/5 px-3 text-left hover:bg-black/[0.03]"
                    style={{ height: ROW_H }}
                  >
                    <TypeIcon type={task.type} size="xs" />
                    <span className="font-mono text-[11px] text-muted-foreground">{task.key}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
                    <Avatar user={task.assignee} size="xs" />
                  </button>
                ))}
                {scheduled.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">No scheduled tasks yet.</p>
                ) : null}
              </div>

              <div className="relative" style={{ width, height }}>
                {/* Weekend + today shading */}
                {Array.from({ length: range.days }).map((_, i) => {
                  const d = addDays(range.from, i);
                  const weekend = d.getDay() === 5 || d.getDay() === 6;
                  return weekend ? (
                    <div
                      key={i}
                      className="absolute inset-y-0 bg-black/[0.025]"
                      style={{ left: i * dayWidth, width: dayWidth }}
                    />
                  ) : null;
                })}
                <div
                  className="absolute inset-y-0 z-10 w-0.5 bg-primary"
                  style={{ left: x(today) + dayWidth / 2 }}
                >
                  <span className="absolute -top-0 left-1 rounded bg-primary px-1 font-mono text-[9px] text-white">
                    today
                  </span>
                </div>
                {scheduled.map((item, row) => {
                  const p = previewOf(item);
                  const left = x(p.start);
                  const w = Math.max(
                    dayWidth,
                    (differenceInCalendarDays(p.due, p.start) + 1) * dayWidth,
                  );
                  const hue = statusMeta(item.task.status).hue;
                  const editable = canEdit(item.task);
                  return (
                    <motion.div
                      key={item.task.id}
                      layout
                      className={cn(
                        "gantt-bar absolute flex h-7 items-center rounded-lg text-[11px] font-medium text-white select-none",
                        editable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                      )}
                      style={{
                        top: row * ROW_H + (ROW_H - 28) / 2,
                        left,
                        width: w,
                        backgroundColor: hue,
                        opacity: item.task.status === "done" ? 0.55 : 1,
                      }}
                      onPointerDown={(e) =>
                        editable ? beginDrag(e, item, "move") : onOpen(item.task.id)
                      }
                      title={`${item.task.key} · ${iso(p.start)} → ${iso(p.due)}`}
                    >
                      {editable ? (
                        <span
                          className="h-full w-2 shrink-0 cursor-ew-resize rounded-l-lg bg-black/15"
                          onPointerDown={(e) => beginDrag(e, item, "start")}
                        />
                      ) : (
                        <span className="w-2" />
                      )}
                      <span className="min-w-0 flex-1 truncate px-1.5">{item.task.title}</span>
                      {editable ? (
                        <span
                          className="h-full w-2 shrink-0 cursor-ew-resize rounded-r-lg bg-black/15"
                          onPointerDown={(e) => beginDrag(e, item, "end")}
                        />
                      ) : (
                        <span className="w-2" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {unscheduled.length ? (
        <div className="card-glow p-4">
          <div className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Unscheduled</h3>
            <span className="font-mono text-[11px] text-muted-foreground">
              {unscheduled.length}
            </span>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unscheduled.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-2 rounded-lg border border-black/8 bg-white px-3 py-2"
              >
                <TypeIcon type={t.type} size="xs" />
                <button
                  type="button"
                  onClick={() => onOpen(t.id)}
                  className="min-w-0 flex-1 truncate text-left text-sm hover:underline"
                >
                  <span className="mr-1 font-mono text-[11px] text-muted-foreground">{t.key}</span>
                  {t.title}
                </button>
                {canEdit(t) ? (
                  <button
                    type="button"
                    onClick={() => onChangeDates(t.id, iso(today), iso(addDays(today, 3)))}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Schedule
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
