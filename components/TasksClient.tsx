"use client";
import { useState } from "react";
import TaskCard from "@/components/TaskCard";
import type { TaskSummary } from "@/types";

type Filter = "all" | "submitted" | "pending";

export default function TasksClient({ tasks }: { tasks: TaskSummary[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const total = tasks.length;
  const submitted = tasks.filter((t) => t.is_submitted).length;
  const pending = total - submitted;
  const progress = total > 0 ? (submitted / total) * 100 : 0;

  const filtered = tasks.filter((t) => {
    if (filter === "submitted") return t.is_submitted;
    if (filter === "pending") return !t.is_submitted;
    return true;
  });

  const filterBtns: { key: Filter; label: string; count: number; cls: string; activeClass: string }[] = [
    {
      key: "all",
      label: "All",
      count: total,
      cls: "bg-white border-gray-200 text-gray-500",
      activeClass: "bg-indigo-50 border-indigo-300 text-indigo-600 font-semibold",
    },
    {
      key: "submitted",
      label: "Submitted",
      count: submitted,
      cls: "bg-white border-gray-200 text-gray-500",
      activeClass: "bg-green-50 border-green-300 text-green-600 font-semibold",
    },
    {
      key: "pending",
      label: "Pending",
      count: pending,
      cls: "bg-white border-gray-200 text-gray-500",
      activeClass: "bg-amber-50 border-amber-300 text-amber-600 font-semibold",
    },
  ];

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8 animate-in">
        <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-bold text-gray-900 mb-1">
          My Tasks
        </h1>
        <p className="text-sm text-gray-400">Annotation queue · {total} total tasks</p>
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8 animate-in shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">Overall Progress</span>
          <span className="text-sm font-medium text-gray-900">{submitted} / {total}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400">{progress.toFixed(0)}% complete</span>
          <span className="text-xs text-gray-400">{pending} remaining</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-5">
        {filterBtns.map(({ key, label, count, cls, activeClass }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
              filter === key ? activeClass : cls + " hover:border-gray-300"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-300">
          <p className="text-sm">No {filter === "all" ? "" : filter} tasks found.</p>
        </div>
      ) : (
        <div className="space-y-3 animate-in">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </main>
  );
}