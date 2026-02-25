"use client";
import { useState } from "react";
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

export default function QaDashboardClient({ grouped, totalAll, submittedAll, isQa2, qa1Users }: Props) {
  const usernames = Object.keys(grouped);

  // Bulk selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkQa1, setBulkQa1] = useState(qa1Users[0] ?? "");
  const [assigning, setAssigning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Per-task inline assign state
  const [inlineAssign, setInlineAssign] = useState<Record<string, string>>({});
  const [savingTask, setSavingTask] = useState<string | null>(null);

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
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
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
      } else {
        showToast("Assignment failed.");
      }
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
      } else {
        showToast("Failed.");
      }
    } finally {
      setSavingTask(null);
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8 animate-in">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-600">QA Access</span>
          {isQa2 && <span className="text-xs px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-600">QA2 — Admin View</span>}
        </div>
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-bold text-gray-900 mb-1">
          QA Dashboard
        </h1>
        <p className="text-sm text-gray-400">
          {isQa2 ? `${usernames.length} annotators · ` : ""}{submittedAll} / {totalAll} tasks submitted
        </p>
      </div>

      {/* Overall progress */}
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

      {/* Bulk assign bar — QA2 only, shows when tasks are selected */}
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

      {/* Per-annotator sections */}
      <div className="space-y-6 animate-in">
        {usernames.map((groupKey) => {
          const tasks = grouped[groupKey];
          const submitted = tasks.filter((t) => t.is_submitted).length;
          const total = tasks.length;
          const pct = total > 0 ? (submitted / total) * 100 : 0;
          const allGroupSelected = tasks.every((t) => selected.has(t.id));

          return (
            <div key={groupKey} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Group header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {/* Checkbox to select all in group — QA2 only */}
                  {isQa2 && (
                    <input
                      type="checkbox"
                      checked={allGroupSelected}
                      onChange={() => toggleSelectAll(tasks)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-500 cursor-pointer accent-indigo-500"
                    />
                  )}
                  <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                    {groupKey.charAt(0).toUpperCase()}
                  </div>
                  {/* QA2 sees real username, QA1 sees masked "Annotator N" */}
                  <span className="text-sm font-medium text-gray-700" style={{ fontFamily: "var(--font-mono)" }}>
                    {groupKey}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-32">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{submitted}/{total}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    pct === 100
                      ? "bg-green-50 border-green-200 text-green-600"
                      : "bg-amber-50 border-amber-200 text-amber-600"
                  }`}>
                    {pct === 100 ? "Complete" : `${total - submitted} pending`}
                  </span>
                </div>
              </div>

              {/* Task rows */}
              <div className="divide-y divide-gray-50">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">
                    {/* Per-task checkbox — QA2 only */}
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
                        style={{ fontFamily: "var(--font-mono)", background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe" }}
                      >
                        Row {task.row_num}
                      </span>
                      <p className="text-sm text-gray-500 truncate flex-1">{task.original_text}</p>
                    </Link>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.is_submitted ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-50 border border-green-200 text-green-600">✓ Submitted</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-600">⏳ Pending</span>
                      )}

                      {/* Inline QA1 assign — QA2 only */}
                      {isQa2 && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <select
                            value={inlineAssign[task.id] ?? ""}
                            onChange={(e) => setInlineAssign((prev) => ({ ...prev, [task.id]: e.target.value }))}
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
                        <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors" viewBox="0 0 14 14" fill="none">
                          <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-xl px-5 py-3 text-sm text-gray-700 shadow-xl animate-in z-50">
          {toast}
        </div>
      )}
    </main>
  );
}