"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { Task } from "@/types";
import { MODEL_MAP } from "@/types";
import ModelRatingTab from "@/components/ModelRatingTab";

type Ratings = Record<string, { score: number; justification: string }>;

function initRatings(task: Task): Ratings {
  const defaults: Ratings = {};
  for (const key of Object.keys(MODEL_MAP)) {
    defaults[key] = {
      score: task.ratings?.[key]?.score ?? 0,
      justification: task.ratings?.[key]?.justification ?? "",
    };
  }
  return defaults;
}

function isAllRated(ratings: Ratings): boolean {
  return Object.keys(MODEL_MAP).every((k) => ratings[k].justification.trim().length > 0);
}

interface TaskDetailClientProps {
  task: Task;
  isQaUser: boolean;
  taskBriefUrl: string;
  nextPendingId: string | null;
}

export default function TaskDetailClient({ task, isQaUser, taskBriefUrl, nextPendingId }: TaskDetailClientProps) {
  const router = useRouter();
  const modelKeys = Object.keys(MODEL_MAP);

  const [activeTab, setActiveTab] = useState(0);
  const [ratings, setRatings] = useState<Ratings>(initRatings(task));
  const [qaFlag, setQaFlag] = useState(task.qa1_flag ?? "PASS");
  const [qaStatus, setQaStatus] = useState(task.qa1_status ?? "pending");
  const [qaFeedback, setQaFeedback] = useState(task.qa1_feedback ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function updateRating(key: string, field: "score" | "justification", value: number | string) {
    setRatings((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const allRated = isAllRated(ratings);
  const currentKey = modelKeys[activeTab];
  const completedCount = modelKeys.filter((k) => ratings[k].justification.trim().length > 0).length;

  async function handleSubmit() {
    if (!allRated) { showToast("Please fill in justification for all 13 models."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratings,
          qa: isQaUser
            ? { flag: qaFlag, feedback: qaFeedback, status: qaStatus }
            : { flag: task.qa1_flag ?? "PASS", feedback: task.qa1_feedback ?? "", status: task.qa1_status ?? "pending" },
        }),
      });
      if (res.ok) {
        showToast(nextPendingId ? "Submitted! Loading next task…" : "All done! 🎉");
        setTimeout(() => router.push(nextPendingId ? `/tasks/${nextPendingId}` : "/tasks"), 800);
      } else {
        showToast("Submission failed. Try again.");
      }
    } catch {
      showToast("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 animate-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-black-400">
        <Link href="/tasks" className="hover:text-gray-600 transition-colors flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Tasks
        </Link>
        <span>/</span>
        <span className="text-gray-500" style={{ fontFamily: "var(--font-mono)" }}>Row {task.row_num}</span>
        {task.is_submitted && (
          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-green-50 border border-green-200 text-green-600">✓ Previously Submitted</span>
        )}
      </div>

      {/* Title */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 style={{ fontFamily: "var(--font-display)" }} className="text-xl font-bold text-gray-900">
              Task Row {task.row_num}
            </h1>
            
            <a
              href={taskBriefUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-indigo-500 hover:border-indigo-300 transition-all shadow-sm"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 11L11 2M11 2H6M11 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Task Brief
            </a>
          </div>
          <p className="text-xs text-black-400">{completedCount} of {modelKeys.length} models evaluated</p>
        </div>
        <div className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {task.language as string}
        </div>
      </div>

      {/* Source + Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-medium text-indigo-500 uppercase tracking-widest mb-3" style={{ fontFamily: "var(--font-mono)" }}>
            Original Text · {task.language as string}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">{task.original_text as string}</p>
          {task.url && (
              <a
                href={task.url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:text-indigo-500 hover:border-indigo-300 transition-all"
              >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 11L11 2M11 2H6M11 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Original URL: {task.url}
            </a>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-widest mb-3 shrink-0" style={{ fontFamily: "var(--font-mono)" }}>
            Notes / Reference
          </p>
          <div className="overflow-y-auto max-h-48 pr-1 prose prose-sm max-w-none
            prose-p:text-gray-600 prose-p:leading-relaxed prose-p:my-1
            prose-headings:text-gray-800 prose-headings:font-semibold
            prose-strong:text-gray-800
            prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1 prose-code:rounded prose-code:text-xs
            prose-ul:text-gray-600 prose-li:my-0.5
            prose-a:text-indigo-500 prose-a:no-underline hover:prose-a:underline">
            <ReactMarkdown>{task.notes as string ?? ""}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Model Evaluation */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6 shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-black-400 uppercase tracking-widest">Model Evaluation</p>
          <span className={`text-xs ${allRated ? "text-green-600" : "text-black-400"}`}>
            {completedCount}/{modelKeys.length} rated
          </span>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-100">
          {modelKeys.map((key, i) => {
            const hasJust = ratings[key].justification.trim().length > 0;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(i)}
                className={`shrink-0 px-4 py-3 text-xs font-medium border-b-2 transition-all duration-150 flex items-center gap-1.5 ${
                  activeTab === i
                    ? "border-indigo-500 text-indigo-600 bg-indigo-50/50"
                    : "border-transparent text-black-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {MODEL_MAP[key]}
                {hasJust && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          <ModelRatingTab
            key={currentKey}
            modelKey={currentKey}
            uiName={MODEL_MAP[currentKey]}
            content={task[currentKey] as string ?? "—"}
            score={ratings[currentKey].score}
            justification={ratings[currentKey].justification}
            onScoreChange={(s) => updateRating(currentKey, "score", s)}
            onJustificationChange={(t) => updateRating(currentKey, "justification", t)}
          />

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => setActiveTab((p) => Math.max(0, p - 1))}
              disabled={activeTab === 0}
              className="text-xs text-black-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Previous
            </button>
            <span className="text-xs text-black-400" style={{ fontFamily: "var(--font-mono)" }}>
              {activeTab + 1} / {modelKeys.length}
            </span>
            <button
              onClick={() => setActiveTab((p) => Math.min(modelKeys.length - 1, p + 1))}
              disabled={activeTab === modelKeys.length - 1}
              className="text-xs text-black-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              Next
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* QA Section */}
      {isQaUser && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3 flex items-center gap-2">
            <p className="text-xs font-semibold text-black-400 uppercase tracking-widest">QA1 Review</p>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-600">QA Access</span>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-medium text-black-400 uppercase tracking-widest block mb-3">QA1 Flag</label>
              <div className="flex gap-2">
                {["PASS", "FAIL"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setQaFlag(opt)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      qaFlag === opt
                        ? opt === "PASS"
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-red-500 border-red-500 text-white"
                        : "bg-white border-gray-200 text-black-400 hover:border-gray-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-black-400 uppercase tracking-widest block mb-3">QA1 Status</label>
              <select
                value={qaStatus}
                onChange={(e) => setQaStatus(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 transition-all"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-black-400 uppercase tracking-widest block mb-3">QA1 Feedback</label>
              <input
                type="text"
                value={qaFeedback}
                onChange={(e) => setQaFeedback(e.target.value)}
                placeholder="Optional notes…"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-indigo-400 transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="space-y-2">
        {!allRated && (
          <p className="text-xs text-amber-500 text-center">
            ⚠ Complete justification for all {modelKeys.length - completedCount} remaining model(s) to enable submission.
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting || !allRated}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl py-3.5 transition-all duration-150 flex items-center justify-center gap-2 shadow-sm"
        >
          {submitting ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Submitting…
            </>
          ) : "Submit Annotation"}
        </button>
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