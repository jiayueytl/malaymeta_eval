"use client";
import Link from "next/link";
import type { TaskSummary } from "@/types";

export default function TaskCard({ task }: { task: TaskSummary }) {
  return (
    <Link href={`/tasks/${task.id}`}>
      <div className="mt-5 group bg-[#111113] border border-[#2e2e38] hover:border-indigo-500/50 rounded-xl p-5 transition-all duration-150 hover:bg-[#14141a] cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "#1e1e2a",
                  color: "#6366f1",
                  border: "1px solid #3730a3",
                }}
              >
                Row {task.row_num}
              </span>
              {task.is_submitted ? (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                  ✓ Submitted
                </span>
              ) : (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  ⏳ Pending
                </span>
              )}
            </div>
            <p className="text-sm text-[#9898a8] line-clamp-2 leading-relaxed">
              {task.original_text}
            </p>
          </div>
          <svg
            className="w-4 h-4 text-[#5c5c72] group-hover:text-indigo-400 transition-colors shrink-0 mt-1"
            viewBox="0 0 16 16" fill="none"
          >
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}
