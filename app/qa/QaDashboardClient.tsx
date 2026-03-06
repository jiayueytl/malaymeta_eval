"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import type { TaskSummary } from "@/types";

interface Props {
  grouped: Record<string, TaskSummary[]>;
  totalAll: number;
  submittedAll: number;
  isQa2: boolean;
  qa1Users: string[];
  currentUsername: string;
}

// ── tiny bar-chart primitive ────────────────────────────────────────────────
function BarChart({
  data,
  colorSubmitted = "#6366f1",
  colorPending = "#e0e7ff",
}: {
  data: { label: string; submitted: number; total: number }[];
  colorSubmitted?: string;
  colorPending?: string;
}) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-2 min-w-0" style={{ minHeight: 96 }}>
        {data.map((d) => {
          const pct = d.total > 0 ? (d.submitted / d.total) * 100 : 0;
          const barH = Math.max(6, (d.total / maxTotal) * 80);
          const fillH = (pct / 100) * barH;
          return (
            <div key={d.label} className="flex flex-col items-center gap-1 flex-1 min-w-0 group cursor-default">
              {/* tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-gray-500 whitespace-nowrap">
                {d.submitted}/{d.total}
              </div>
              {/* bar */}
              <div
                className="w-full rounded-t-md relative overflow-hidden"
                style={{ height: barH, background: colorPending, minWidth: 18 }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-700"
                  style={{ height: fillH, background: colorSubmitted }}
                />
              </div>
              {/* label */}
              <span
                className="text-[9px] text-gray-400 truncate w-full text-center"
                style={{ fontFamily: "var(--font-mono)" }}
                title={d.label}
              >
                {d.label.length > 8 ? d.label.slice(0, 7) + "…" : d.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* legend */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: colorSubmitted }} />
          <span className="text-[10px] text-gray-400">Submitted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: colorPending }} />
          <span className="text-[10px] text-gray-400">Pending</span>
        </div>
      </div>
    </div>
  );
}

// ── group-by field keys ──────────────────────────────────────────────────────
type GroupByField = "none" | keyof TaskSummary;

const GROUP_OPTIONS: { value: GroupByField; label: string }[] = [
  { value: "none", label: "Default (by annotator)" },
  { value: "original_text", label: "Original Text" },
  { value: "is_submitted", label: "Submission Status" },
  { value: "row_num", label: "Row Number" },
  { value: "id", label: "Task ID" },
];

export default function QaDashboardClient({
  grouped,
  totalAll,
  submittedAll,
  isQa2,
  qa1Users,
}: Props) {
  const usernames = Object.keys(grouped);

  // ── bulk selection ─────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkQa1, setBulkQa1] = useState(qa1Users[0] ?? "");
  const [assigning, setAssigning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ── inline assign ──────────────────────────────────────────────────────────
  const [inlineAssign, setInlineAssign] = useState<Record<string, string>>({});
  const [savingTask, setSavingTask] = useState<string | null>(null);

  // ── charts visibility ──────────────────────────────────────────────────────
  const [showAnnotatorChart, setShowAnnotatorChart] = useState(true);
  const [showQaChart, setShowQaChart] = useState(true);

  // ── group-by ───────────────────────────────────────────────────────────────
  const [groupBy, setGroupBy] = useState<GroupByField>("none");

  // ── derived: all tasks flat ────────────────────────────────────────────────
  const allTasks = useMemo(
    () => Object.values(grouped).flat(),
    [grouped]
  );

  // ── task id → annotator username (always from original grouped keys) ───────
  const taskUsernameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [username, tasks] of Object.entries(grouped)) {
      for (const task of tasks) map[task.id] = username;
    }
    return map;
  }, [grouped]);

  // ── annotator chart data ───────────────────────────────────────────────────
  const annotatorChartData = useMemo(
    () =>
      usernames.map((u) => ({
        label: u,
        submitted: grouped[u].filter((t) => t.is_submitted).length,
        total: grouped[u].length,
      })),
    [grouped, usernames]
  );

  // ── QA1 chart data (tasks assigned to qa1 users) ──────────────────────────
  // We derive QA progress from qa1Users × tasks that have a qa1_username field
  // Gracefully handles if the field doesn't exist (shows 0s)
  const qaChartData = useMemo(
    () =>
      qa1Users.map((qa) => {
        const qaTasksAll = allTasks.filter(
          (t) => (t as any).qa1_username === qa
        );
        return {
          label: qa,
          submitted: qaTasksAll.filter((t) => t.is_submitted).length,
          total: qaTasksAll.length,
        };
      }),
    [qa1Users, allTasks]
  );

  // ── re-grouped display based on groupBy ────────────────────────────────────
  const displayGrouped = useMemo<Record<string, TaskSummary[]>>(() => {
    if (groupBy === "none") return grouped;
    const result: Record<string, TaskSummary[]> = {};
    for (const task of allTasks) {
      const rawVal = (task as any)[groupBy];
      let key: string;
      if (rawVal === undefined || rawVal === null) key = "(none)";
      else if (typeof rawVal === "boolean") key = rawVal ? "✓ Submitted" : "⏳ Pending";
      else key = String(rawVal).slice(0, 60);
      (result[key] ??= []).push(task);
    }
    return result;
  }, [groupBy, grouped, allTasks]);

  const displayKeys = Object.keys(displayGrouped);

  // ── helpers ────────────────────────────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll(tasks: TaskSummary[]) {
    const ids = tasks.map((t) => t.id);
    const allSel = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSel) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  async function handleBulkAssign() {
    if (!selected.size || !bulkQa1) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/tasks/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: [...selected], qa1Username: bulkQa1 }),
      });
      if (res.ok) {
        showToast(`Assigned ${selected.size} task(s) to ${bulkQa1}`);
        setSelected(new Set());
        setTimeout(() => window.location.reload(), 800);
      } else showToast("Assignment failed.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleInlineAssign(taskId: string) {
    const qa1 = inlineAssign[taskId];
    if (!qa1) return;
    setSavingTask(taskId);
    try {
      const res = await fetch("/api/tasks/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: [taskId], qa1Username: qa1 }),
      });
      if (res.ok) {
        showToast(`Assigned to ${qa1}`);
        setTimeout(() => window.location.reload(), 600);
      } else showToast("Failed.");
    } finally {
      setSavingTask(null);
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {/* ── Header ── */}
      <div className="mb-8 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-600">QA Access</span>
          {isQa2 && (
            <span className="text-xs px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-600">
              QA2 — Admin View
            </span>
          )}
        </div>
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-bold text-gray-900 mb-1">
          QA Dashboard
        </h1>
        <p className="text-sm text-gray-400">
          {isQa2 ? `${usernames.length} annotators · ` : ""}
          {submittedAll} / {totalAll} tasks submitted
        </p>
      </div>

      {/* ── Overall progress bar ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm animate-in">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">Overall Annotation Progress</span>
          <span className="text-sm font-medium text-gray-900">{submittedAll} / {totalAll}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${totalAll > 0 ? (submittedAll / totalAll) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-in">
        {/* Annotator Progress Chart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Annotator Progress</h2>
              <p className="text-xs text-gray-400 mt-0.5">Submissions per annotator</p>
            </div>
            <button
              onClick={() => setShowAnnotatorChart((v) => !v)}
              className="text-xs text-gray-400 hover:text-indigo-500 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
            >
              {showAnnotatorChart ? "Hide" : "Show"}
            </button>
          </div>
          {showAnnotatorChart && (
            annotatorChartData.length > 0 ? (
              <BarChart data={annotatorChartData} />
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">No data available</p>
            )
          )}
        </div>

        {/* QA1 Progress Chart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">QA Progress</h2>
              <p className="text-xs text-gray-400 mt-0.5">Assigned tasks per QA reviewer</p>
            </div>
            <button
              onClick={() => setShowQaChart((v) => !v)}
              className="text-xs text-gray-400 hover:text-indigo-500 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
            >
              {showQaChart ? "Hide" : "Show"}
            </button>
          </div>
          {showQaChart && (
            qaChartData.length > 0 ? (
              <BarChart
                data={qaChartData}
                colorSubmitted="#8b5cf6"
                colorPending="#ede9fe"
              />
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">No QA assignment data available</p>
            )
          )}
        </div>
      </div>

      {/* ── Group-by control ── */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 mb-4 shadow-sm flex items-center gap-3 animate-in flex-wrap">
        <span className="text-xs font-medium text-gray-500 shrink-0">Group tasks by</span>
        <div className="flex flex-wrap gap-2">
          {GROUP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGroupBy(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                groupBy === opt.value
                  ? "bg-indigo-500 border-indigo-500 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {groupBy !== "none" && (
          <span className="ml-auto text-xs text-indigo-500 font-medium shrink-0">
            {displayKeys.length} group{displayKeys.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Bulk assign bar — QA2 only ── */}
      {isQa2 && selected.size > 0 && (
        <div className="sticky top-16 z-40 mb-4 animate-in">
          <div className="bg-indigo-600 rounded-xl px-5 py-3 flex items-center gap-4 shadow-lg">
            <span className="text-white text-sm font-medium">{selected.size} task(s) selected</span>
            <div className="flex-1" />
            <select
              value={bulkQa1}
              onChange={(e) => setBulkQa1(e.target.value)}
              className="bg-indigo-500 border border-indigo-400 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
            >
              {qa1Users.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <button
              onClick={handleBulkAssign}
              disabled={assigning}
              className="bg-white text-indigo-600 font-semibold text-xs px-4 py-2 rounded-lg hover:bg-indigo-50 transition-all disabled:opacity-50"
            >
              {assigning ? "Assigning…" : "Assign QA1"}
            </button>
            <button onClick={() => setSelected(new Set())} className="text-indigo-200 hover:text-white text-xs">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Per-group sections ── */}
      <div className="space-y-6 animate-in">
        {displayKeys.map((groupKey) => {
          const tasks = displayGrouped[groupKey];
          const submitted = tasks.filter((t) => t.is_submitted).length;
          const total = tasks.length;
          const pct = total > 0 ? (submitted / total) * 100 : 0;
          const allGroupSelected = tasks.every((t) => selected.has(t.id));

          return (
            <div key={groupKey} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Group header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                  {isQa2 && (
                    <input
                      type="checkbox"
                      checked={allGroupSelected}
                      onChange={() => toggleSelectAll(tasks)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-500 cursor-pointer accent-indigo-500 shrink-0"
                    />
                  )}
                  <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {groupKey.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className="text-sm font-medium text-gray-700 truncate"
                    style={{ fontFamily: "var(--font-mono)" }}
                    title={groupKey}
                  >
                    {groupKey}
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2 w-32">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{submitted}/{total}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      pct === 100
                        ? "bg-green-50 border-green-200 text-green-600"
                        : "bg-amber-50 border-amber-200 text-amber-600"
                    }`}
                  >
                    {pct === 100 ? "Complete" : `${total - submitted} pending`}
                  </span>
                </div>
              </div>

              {/* Task rows */}
              <div className="divide-y divide-gray-50">
                {tasks.map((task, _i) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    {isQa2 && (
                      <input
                        type="checkbox"
                        checked={selected.has(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-indigo-500 shrink-0"
                      />
                    )}

                    <Link href={`/tasks/${task.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <span
                        className="text-xs shrink-0 w-14 text-center px-2 py-0.5 rounded"
                        style={{
                          fontFamily: "var(--font-mono)",
                          background: "#eef2ff",
                          color: "#4f46e5",
                          border: "1px solid #c7d2fe",
                        }}
                      >
                        ID {task.row_num}
                      </span>
                      <p className="text-sm text-gray-500 truncate flex-1">{task.original_text}</p>
                      {isQa2 && (
                        <span
                          className="text-xs shrink-0 px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200 hidden sm:inline"
                          style={{ fontFamily: "var(--font-mono)" }}
                          title={taskUsernameMap[task.id]}
                        >
                          {taskUsernameMap[task.id]}
                        </span>
                      )}
                    </Link>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.is_submitted ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-50 border border-green-200 text-green-600">
                          ✓ Submitted
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-600">
                          ⏳ Pending
                        </span>
                      )}

                      {isQa2 && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <select
                            value={inlineAssign[task.id] ?? ""}
                            onChange={(e) =>
                              setInlineAssign((prev) => ({ ...prev, [task.id]: e.target.value }))
                            }
                            className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:border-indigo-400"
                          >
                            <option value="">Assign QA1…</option>
                            {qa1Users.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                          {inlineAssign[task.id] && (
                            <button
                              onClick={() => handleInlineAssign(task.id)}
                              disabled={savingTask === task.id}
                              className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded-lg transition-all disabled:opacity-50"
                            >
                              {savingTask === task.id ? "…" : "Save"}
                            </button>
                          )}
                        </div>
                      )}

                      <Link href={`/tasks/${task.id}`}>
                        <svg
                          className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            d="M5 3l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-xl px-5 py-3 text-sm text-gray-700 shadow-xl animate-in z-50">
          {toast}
        </div>
      )}
    </main>
  );
}