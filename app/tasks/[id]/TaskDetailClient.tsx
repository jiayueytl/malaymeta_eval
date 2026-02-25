"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Task } from "@/types";
import { MODEL_MAP } from "@/types";
import ModelRatingTab from "@/components/ModelRatingTab";
import ReactMarkdown from "react-markdown";

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
  return Object.keys(MODEL_MAP).every(
    (k) =>
      ratings[k].justification.trim().length > 0
  );
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
  const [qaFlag, setQaFlag] = useState<string>(task.qa1_flag ?? "PASS");
  const [qaStatus, setQaStatus] = useState<string>(task.qa1_status ?? "pending");
  const [qaFeedback, setQaFeedback] = useState<string>(task.qa1_feedback ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function updateRating(key: string, field: "score" | "justification", value: number | string) {
    setRatings((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const allRated = isAllRated(ratings);

  async function handleSubmit() {
    if (!allRated) {
      showToast("Please fill in justification for all 13 models before submitting.");
      return;
    }

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

  const currentKey = modelKeys[activeTab];
  const completedCount = modelKeys.filter(
    (k) => ratings[k].justification.trim().length > 0
  ).length;

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 animate-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-[#5c5c72]">
        <Link href="/tasks" className="hover:text-[#9898a8] transition-colors flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Tasks
        </Link>
        <span>/</span>
        <span className="text-[#9898a8]" style={{ fontFamily: "var(--font-mono)" }}>
          Row {task.row_num}
        </span>
        {task.is_submitted && (
          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400">
            ✓ Previously Submitted
          </span>
        )}
      </div>

      {/* Title + task brief button */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 style={{ fontFamily: "var(--font-display)" }} className="text-xl font-bold text-white">
              Task Row {task.row_num}
            </h1>
            <a
              href={taskBriefUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#18181c] border border-[#2e2e38] text-[#9898a8] hover:text-indigo-400 hover:border-indigo-500/40 transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 11L11 2M11 2H6M11 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Task Brief
            </a>
          </div>
          <p className="text-xs text-[#5c5c72]">
            {completedCount} of {modelKeys.length} models evaluated
          </p>
        </div>
        <div className="text-xs text-[#9898a8] bg-[#18181c] border border-[#2e2e38] rounded-lg px-3 py-2" style={{ fontFamily: "var(--font-mono)" }}>
          {task.language}
        </div>
      </div>

      {/* Source + Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-[#111113] border border-[#2e2e38] rounded-xl p-5">
          <p className="text-xs font-medium text-indigo-400 uppercase tracking-widest mb-3" style={{ fontFamily: "var(--font-mono)" }}>
            Original Text · {task.language}
          </p>
          <p className="text-sm text-[#f4f4f6] leading-relaxed">{task.original_text}</p>

          <p className="text-sm text-[#f4f4f6] leading-relaxed">
            <a
                href={task.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#18181c] border border-[#2e2e38] text-[#9898a8] hover:text-indigo-400 hover:border-indigo-500/40 transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 11L11 2M11 2H6M11 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Original URL: {task.url}
              </a>
            </p>
        </div>
        
        <div className="bg-[#111113] border border-[#2e2e38] rounded-xl p-5 flex flex-col">
          <p className="text-xs font-medium text-emerald-400 uppercase tracking-widest mb-3 shrink-0" style={{ fontFamily: "var(--font-mono)" }}>
            Notes / Reference
          </p>
          <div className="overflow-y-auto max-h-48 pr-1 prose prose-invert prose-sm max-w-none
            prose-p:text-[#9898a8] prose-p:leading-relaxed prose-p:my-1
            prose-headings:text-[#f4f4f6] prose-headings:font-semibold
            prose-strong:text-[#f4f4f6]
            prose-code:text-indigo-300 prose-code:bg-[#1e1e2a] prose-code:px-1 prose-code:rounded prose-code:text-xs
            prose-ul:text-[#9898a8] prose-li:my-0.5
            prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline">
            <ReactMarkdown>{task.notes ?? ""}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Model Evaluation */}
      <div className="bg-[#111113] border border-[#2e2e38] rounded-2xl overflow-hidden mb-6">
        <div className="border-b border-[#2e2e38] px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-[#9898a8] uppercase tracking-widest">
            Model Evaluation
          </p>
          <span className={`text-xs ${allRated ? "text-green-400" : "text-[#5c5c72]"}`}>
            {completedCount}/{modelKeys.length} rated
          </span>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-[#2e2e38]">
          {modelKeys.map((key, i) => {
            const hasJust = ratings[key].justification.trim().length > 0;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(i)}
                className={`shrink-0 px-4 py-3 text-xs font-medium border-b-2 transition-all duration-150 flex items-center gap-1.5 ${
                  activeTab === i
                    ? "border-indigo-500 text-indigo-400 bg-[#18181c]"
                    : "border-transparent text-[#5c5c72] hover:text-[#9898a8] hover:bg-[#14141a]"
                }`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {MODEL_MAP[key]}
                {hasJust && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Active model panel */}
        <div className="p-6">
          <ModelRatingTab
            key={currentKey}
            modelKey={currentKey}
            uiName={MODEL_MAP[currentKey]}
            // content={(task as Record<string, unknown>)[currentKey] as string ?? "—"}
            content={task[currentKey] as string ?? "—"}
            score={ratings[currentKey].score}
            justification={ratings[currentKey].justification}
            onScoreChange={(s) => updateRating(currentKey, "score", s)}
            onJustificationChange={(t) => updateRating(currentKey, "justification", t)}
          />

          {/* Tab navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#2e2e38]">
            <button
              onClick={() => setActiveTab((p) => Math.max(0, p - 1))}
              disabled={activeTab === 0}
              className="text-xs text-[#9898a8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Previous
            </button>
            <span className="text-xs text-[#5c5c72]" style={{ fontFamily: "var(--font-mono)" }}>
              {activeTab + 1} / {modelKeys.length}
            </span>
            <button
              onClick={() => setActiveTab((p) => Math.min(modelKeys.length - 1, p + 1))}
              disabled={activeTab === modelKeys.length - 1}
              className="text-xs text-[#9898a8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              Next
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* QA1 Review — only visible to QA users */}
      {isQaUser && (
        <div className="bg-[#111113] border border-[#2e2e38] rounded-2xl overflow-hidden mb-8">
          <div className="border-b border-[#2e2e38] px-5 py-3 flex items-center gap-2">
            <p className="text-xs font-semibold text-[#9898a8] uppercase tracking-widest">QA1 Review</p>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              QA Access
            </span>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Flag */}
            <div>
              <label className="text-xs font-medium text-[#9898a8] uppercase tracking-widest block mb-3">
                QA1 Flag
              </label>
              <div className="flex gap-2">
                {["PASS", "FAIL"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setQaFlag(opt)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      qaFlag === opt
                        ? opt === "PASS"
                          ? "bg-green-600 border-green-500 text-white"
                          : "bg-red-600 border-red-500 text-white"
                        : "bg-[#18181c] border-[#2e2e38] text-[#9898a8] hover:border-[#3f3f50]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-medium text-[#9898a8] uppercase tracking-widest block mb-3">
                QA1 Status
              </label>
              <select
                value={qaStatus}
                onChange={(e) => setQaStatus(e.target.value)}
                className="w-full bg-[#18181c] border border-[#2e2e38] rounded-xl px-3 py-2.5 text-sm text-[#f4f4f6] focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Feedback */}
            <div>
              <label className="text-xs font-medium text-[#9898a8] uppercase tracking-widest block mb-3">
                QA1 Feedback
              </label>
              <input
                type="text"
                value={qaFeedback}
                onChange={(e) => setQaFeedback(e.target.value)}
                placeholder="Optional notes…"
                className="w-full bg-[#18181c] border border-[#2e2e38] rounded-xl px-3 py-2.5 text-sm text-[#f4f4f6] placeholder:text-[#5c5c72] focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="space-y-2">
        {!allRated && (
          <p className="text-xs text-amber-400 text-center">
            ⚠ Complete justification for all {modelKeys.length - completedCount} remaining model(s) to enable submission.
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting || !allRated}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl py-3.5 transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          {submitting ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Submitting…
            </>
          ) : (
            "Submit Annotation"
          )}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#18181c] border border-[#2e2e38] rounded-xl px-5 py-3 text-sm text-white shadow-2xl animate-in z-50">
          {toast}
        </div>
      )}
    </main>
  );
}