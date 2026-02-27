"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { Task } from "@/types";
import { MODEL_MAP } from "@/types";
import ModelRatingTab from "@/components/ModelRatingTab";

type Ratings = Record<string, { score: number; justification: string }>;
type QaRatings = Record<string, { justification: string }>;

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

function initQaRatings(data: Record<string, { justification: string }> | null): QaRatings {
  const defaults: QaRatings = {};
  for (const key of Object.keys(MODEL_MAP)) {
    defaults[key] = { justification: data?.[key]?.justification ?? "" };
  }
  return defaults;
}

function isAllRated(ratings: Ratings): boolean {
  return Object.keys(MODEL_MAP).every((k) => ratings[k].justification.trim().length > 0);
}

const SCORE_COLORS: Record<number, { dot: string; tab: string }> = {
  0: { dot: "bg-red-400",    tab: "text-red-500 border-red-300 bg-red-50/60" },
  1: { dot: "bg-orange-400", tab: "text-orange-500 border-orange-300 bg-orange-50/60" },
  2: { dot: "bg-yellow-400", tab: "text-yellow-600 border-yellow-300 bg-yellow-50/60" },
  3: { dot: "bg-green-400",  tab: "text-green-600 border-green-300 bg-green-50/60" },
  4: { dot: "bg-blue-400",   tab: "text-blue-600 border-blue-300 bg-blue-50/60" },
};

interface TaskDetailClientProps {
  task: Task;
  isQaUser: boolean;
  taskBriefUrl: string;
  nextPendingId: string | null;
  isQa2User: boolean;
}

export default function TaskDetailClient(
  { task, isQaUser, isQa2User, taskBriefUrl, nextPendingId }: TaskDetailClientProps) 
{
  const router = useRouter();
  const modelKeys = Object.keys(MODEL_MAP);

  const isLocked = !isQaUser && task.qa1_status === "done";

  const [activeTab, setActiveTab] = useState(0);
  const [ratings, setRatings] = useState<Ratings>(initRatings(task));
  const [qa1Ratings, setQa1Ratings] = useState<QaRatings>(initQaRatings(task.qa1_ratings));
  const [qa2Ratings, setQa2Ratings] = useState<QaRatings>(initQaRatings(task.qa2_ratings));

  const [qa1Flag, setQa1Flag] = useState(task.qa1_flag ?? "PASS");
  const [qa1Status, setQa1Status] = useState(task.qa1_status ?? "pending");
  const [qa1Feedback, setQa1Feedback] = useState(task.qa1_feedback ?? "");

  const [qa2Flag, setQa2Flag] = useState(task.qa2_flag ?? "PASS");
  const [qa2Status, setQa2Status] = useState(task.qa2_status ?? "pending");
  const [qa2Feedback, setQa2Feedback] = useState(task.qa2_feedback ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function updateRating(key: string, field: "score" | "justification", value: number | string) {
    setRatings((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  function updateQa1Rating(key: string, justification: string) {
    setQa1Ratings((prev) => ({ ...prev, [key]: { justification } }));
  }

  function updateQa2Rating(key: string, justification: string) {
    setQa2Ratings((prev) => ({ ...prev, [key]: { justification } }));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const allRated = isAllRated(ratings);
  const currentKey = modelKeys[activeTab];
  const completedCount = modelKeys.filter((k) => ratings[k].justification.trim().length > 0).length;

  async function handleSubmit() {
    if (!isLocked && !allRated) {
      showToast("Please fill in justification for all 13 models.");
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
            ? {
                flag: qa1Flag, feedback: qa1Feedback, status: qa1Status,
                qa1Ratings,
                qa2Flag, qa2Feedback, qa2Status,
                qa2Ratings,
              }
            : {
                flag: task.qa1_flag ?? "PASS",
                feedback: task.qa1_feedback ?? "",
                status: task.qa1_status ?? "pending",
              },
        }),
      });
      if (res.ok) {
        showToast(nextPendingId ? "Submitted! Loading next task…" : "All done! 🎉");
        setTimeout(() => router.push(nextPendingId ? `/tasks/${nextPendingId}` : "/tasks"), 800);
      } else {
        const data = await res.json();
        showToast(data.error ?? "Submission failed. Try again.");
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
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
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
        {isLocked && (
          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-500 flex items-center gap-1">
            🔒 Locked by QA
          </span>
        )}
      </div>

      {/* Title */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 style={{ fontFamily: "var(--font-display)" }} className="text-xl font-bold text-gray-900">
              Task ID {task.row_num}
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
          <p className="text-xs text-gray-400">{completedCount} of {modelKeys.length} models evaluated</p>
        </div>
        <div className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {task.language as string}
        </div>
      </div>

      {/* Locked banner */}
      {isLocked && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-red-400">
            <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="text-sm text-red-600">This task has been locked by QA. Your ratings and justifications are read-only.</p>
        </div>
      )}

      {/* Source + Notes */}
      <div className="sticky top-14 z-30 bg-[#f5f5f7] pt-4 pb-4 -mx-6 px-6 border-b border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Original URL
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
      </div>

      {/* Model Evaluation */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6 shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Model Evaluation</p>
          <span className={`text-xs ${allRated ? "text-green-600" : "text-gray-400"}`}>
            {completedCount}/{modelKeys.length} rated
          </span>
        </div>

        {/* Tabs — coloured when rated */}
        <div className="flex overflow-x-auto border-b border-gray-100">
          {modelKeys.map((key, i) => {
            const hasJust = ratings[key].justification.trim().length > 0;
            const s = ratings[key].score;
            const scoreStyle = hasJust ? SCORE_COLORS[s] : null;
            const isActive = activeTab === i;

            return (
              <button
                key={key}
                onClick={() => setActiveTab(i)}
                className={`shrink-0 px-4 py-3 text-xs font-medium border-b-2 transition-all duration-150 flex items-center gap-1.5 ${
                  isActive
                    ? scoreStyle
                      ? `border-current ${scoreStyle.tab}`
                      : "border-indigo-500 text-indigo-600 bg-indigo-50/50"
                    : scoreStyle
                      ? `border-transparent ${scoreStyle.tab} opacity-80 hover:opacity-100`
                      : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {MODEL_MAP[key]}
                {hasJust && scoreStyle && (
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${scoreStyle.dot}`} />
                )}
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
            qa1Justification={qa1Ratings[currentKey]?.justification}
            qa2Justification={qa2Ratings[currentKey]?.justification} 
            isQaUser={isQaUser}
            isQa2User={isQa2User}                                       
            isLocked={isLocked}
            onScoreChange={(s) => updateRating(currentKey, "score", s)}
            onJustificationChange={(t) => updateRating(currentKey, "justification", t)}
            onQa1JustificationChange={(t) => updateQa1Rating(currentKey, t)}
            onQa2JustificationChange={(t) => updateQa2Rating(currentKey, t)} 
          />

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => setActiveTab((p) => Math.max(0, p - 1))}
              disabled={activeTab === 0}
              className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Previous
            </button>
            <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-mono)" }}>
              {activeTab + 1} / {modelKeys.length}
            </span>
            <button
              onClick={() => setActiveTab((p) => Math.min(modelKeys.length - 1, p + 1))}
              disabled={activeTab === modelKeys.length - 1}
              className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              Next
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* QA Section — only for QA users */}
      {isQaUser && (
        <>
          {/* QA1 */}
          <div className="bg-white border border-indigo-100 rounded-2xl overflow-hidden mb-4 shadow-sm">
            <div className="border-b border-indigo-100 px-5 py-3 flex items-center gap-2 bg-indigo-50/40">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">QA1 Review</p>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 border border-indigo-200 text-indigo-600">Round 1</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-widest block mb-3">QA1 Flag</label>
                  <div className="flex gap-2">
                    {["PASS", "FAIL"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setQa1Flag(opt)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          qa1Flag === opt
                            ? opt === "PASS" ? "bg-green-500 border-green-500 text-white" : "bg-red-500 border-red-500 text-white"
                            : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-widest block mb-3">QA1 Status</label>
                  <select
                    value={qa1Status}
                    onChange={(e) => setQa1Status(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 transition-all"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done (locks annotator)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-widest block mb-3">QA1 Feedback</label>
                  <input
                    type="text"
                    value={qa1Feedback}
                    onChange={(e) => setQa1Feedback(e.target.value)}
                    placeholder="Overall QA1 notes…"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>
              {/* <p className="text-xs text-indigo-400 mb-2">Per-model QA1 justifications are entered inside each Model tab above ↑</p>
              <div className="flex flex-wrap gap-2">
                {modelKeys.map((key) => {
                  const done = qa1Ratings[key]?.justification.trim().length > 0;
                  return (
                    <span key={key} className={`text-xs px-2 py-0.5 rounded-full border ${done ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
                      {MODEL_MAP[key]} {done ? "✓" : "·"}
                    </span>
                  );
                })}
              </div> */}
            </div>
          </div>

          {/* QA2 */}
          <div className="bg-white border border-purple-100 rounded-2xl overflow-hidden mb-8 shadow-sm">
            <div className="border-b border-purple-100 px-5 py-3 flex items-center gap-2 bg-purple-50/40">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-widest">QA2 Review</p>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-100 border border-purple-200 text-purple-600">Round 2</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-widest block mb-3">QA2 Flag</label>
                  <div className="flex gap-2">
                    {["PASS", "FAIL"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setQa2Flag(opt)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          qa2Flag === opt
                            ? opt === "PASS" ? "bg-green-500 border-green-500 text-white" : "bg-red-500 border-red-500 text-white"
                            : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-widest block mb-3">QA2 Status</label>
                  <select
                    value={qa2Status}
                    onChange={(e) => setQa2Status(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 transition-all"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-widest block mb-3">QA2 Feedback</label>
                  <input
                    type="text"
                    value={qa2Feedback}
                    onChange={(e) => setQa2Feedback(e.target.value)}
                    placeholder="Overall QA2 notes…"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>

              {/* QA2 per-model justifications */}
              {/* <p className="text-xs text-purple-400 mb-3">Per-model QA2 justifications</p>
              <div className="space-y-3">
                {modelKeys.map((key) => (
                  <div key={key} className="flex gap-3 items-start">
                    <span className="text-xs pt-2.5 text-gray-400 shrink-0 w-16 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                      {MODEL_MAP[key]}
                    </span>
                    <textarea
                      rows={2}
                      value={qa2Ratings[key]?.justification ?? ""}
                      onChange={(e) => updateQa2Rating(key, e.target.value)}
                      placeholder={`QA2 notes for ${MODEL_MAP[key]}…`}
                      className="flex-1 bg-purple-50/50 border border-purple-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder:text-purple-300 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-all resize-none"
                    />
                  </div>
                ))}
              </div> */}
            </div>
          </div>
        </>
      )}

      {/* Submit */}
      <div className="space-y-2">
        {!isLocked && !allRated && (
          <p className="text-xs text-amber-500 text-center">
            ⚠ Complete justification for all {modelKeys.length - completedCount} remaining model(s) to enable submission.
          </p>
        )}
        {isLocked && (
          <p className="text-xs text-red-400 text-center">🔒 This task is locked. Only QA users can make changes.</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting || (!isQaUser && (isLocked || !allRated))}
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
          ) : isQaUser ? "Save QA Review" : "Submit Annotation"}
        </button>

        {/* Skip button — only for QA users when there's a next task */}
        {isQaUser && nextPendingId && (
          <button
            onClick={() => router.push(`/tasks/${nextPendingId}`)}
            disabled={submitting}
            className="w-full bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-500 hover:text-gray-700 font-medium text-sm rounded-xl py-3 transition-all duration-150 flex items-center justify-center gap-2 border border-gray-200 shadow-sm"
          >
            Skip to next task
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
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