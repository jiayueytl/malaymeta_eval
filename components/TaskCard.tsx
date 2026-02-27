"use client";
import Link from "next/link";
import type { TaskSummary } from "@/types";

export default function TaskCard({ task }: { task: TaskSummary }) {
  return (
    <Link href={`/tasks/${task.id}`}>
      <div className="mt-5 group bg-white border border-gray-200 hover:border-indigo-300 rounded-xl p-5 transition-all duration-150 hover:shadow-md cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{ fontFamily: "var(--font-mono)", background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe" }}
              >
                ID {task.row_num}
              </span>
              {task.is_submitted ? (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-50 text-green-600 border border-green-200">✓ Submitted</span>
              ) : (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">⏳ Pending</span>
              )}
            </div>
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{task.original_text}</p>
          </div>
          <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0 mt-1" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}