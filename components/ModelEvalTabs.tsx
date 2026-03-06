"use client";
import { useState } from "react";
import ModelRatingTab from "@/components/ModelRatingTab";
import { MODEL_MAP } from "@/types";

type Ratings = Record<string, { score: number; justification: string }>;

const SCORE_COLORS: Record<number, { dot: string; tab: string }> = {
  0: { dot: "bg-red-400",    tab: "text-red-500 border-red-300 bg-red-50/60" },
  1: { dot: "bg-orange-400", tab: "text-orange-500 border-orange-300 bg-orange-50/60" },
  2: { dot: "bg-yellow-400", tab: "text-yellow-600 border-yellow-300 bg-yellow-50/60" },
  3: { dot: "bg-green-400",  tab: "text-green-600 border-green-300 bg-green-50/60" },
  4: { dot: "bg-blue-400",   tab: "text-blue-600 border-blue-300 bg-blue-50/60" },
};

interface ModelEvalTabsProps {
  taskContent: Record<string, string>;
  ratings: Ratings;
  onRatingChange?: (key: string, field: "score" | "justification", value: number | string) => void;
  // QA1
  qa1Ratings?: Record<string, { score: number; justification: string }>;
  onQa1RatingChange?: (key: string, field: "score" | "justification", value: number | string) => void;
  // QA2
  qa2Ratings?: Record<string, { score: number; justification: string }>;
  onQa2RatingChange?: (key: string, field: "score" | "justification", value: number | string) => void;
  // Flags
  isReadOnly?: boolean;
  isQaUser?: boolean;
  isQa2User?: boolean;
  label?: string;
  accentColor?: "indigo" | "amber";
}

export default function ModelEvalTabs({
  taskContent,
  ratings,
  onRatingChange,
  qa1Ratings,
  onQa1RatingChange,
  qa2Ratings,
  onQa2RatingChange,
  isReadOnly = false,
  isQaUser = false,
  isQa2User = false,
  label = "Model Evaluation",
  accentColor = "indigo",
}: ModelEvalTabsProps) {
  const modelKeys = Object.keys(MODEL_MAP);
  const [activeTab, setActiveTab] = useState(0);

  const completedCount = modelKeys.filter((k) => ratings[k]?.justification.trim().length > 0).length;
  const allRated = completedCount === modelKeys.length;
  const currentKey = modelKeys[activeTab];

  const borderClass = accentColor === "amber" ? "border-amber-200" : "border-gray-200";
  const headerClass = accentColor === "amber" ? "text-amber-600" : "text-gray-400";
  const activeTabClass = accentColor === "amber"
    ? "border-amber-500 text-amber-700 bg-amber-50/50"
    : "border-indigo-500 text-indigo-600 bg-indigo-50/50";

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden mb-6 shadow-sm ${borderClass}`}>
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <p className={`text-xs font-semibold uppercase tracking-widest ${headerClass}`}>{label}</p>
        <div className="flex items-center gap-3">
          {isReadOnly && (
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-400">Read-only</span>
          )}
          <span className={`text-xs ${allRated ? "text-green-600" : "text-gray-400"}`}>
            {completedCount}/{modelKeys.length} rated
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-100">
        {modelKeys.map((key, i) => {
          const hasJust = ratings[key]?.justification.trim().length > 0;
          const s = ratings[key]?.score ?? 0;
          const scoreStyle = hasJust ? SCORE_COLORS[s] : null;
          const isActive = activeTab === i;
          return (
            <button key={key} onClick={() => setActiveTab(i)}
              className={`shrink-0 px-4 py-3 text-xs font-medium border-b-2 transition-all duration-150 flex items-center gap-1.5 ${
                isActive
                  ? scoreStyle ? `border-current ${scoreStyle.tab}` : activeTabClass
                  : scoreStyle
                    ? `border-transparent ${scoreStyle.tab} opacity-80 hover:opacity-100`
                    : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {MODEL_MAP[key]}
              {hasJust && (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${scoreStyle ? scoreStyle.dot : "bg-indigo-400"}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-6">
        <ModelRatingTab
          key={currentKey}
          modelKey={currentKey}
          uiName={MODEL_MAP[currentKey]}
          content={taskContent[currentKey] ?? "—"}
          score={ratings[currentKey]?.score ?? 0}
          justification={ratings[currentKey]?.justification ?? ""}
          qa1Score={qa1Ratings?.[currentKey]?.score}
          qa1Justification={qa1Ratings?.[currentKey]?.justification}
          qa2Score={qa2Ratings?.[currentKey]?.score}
          qa2Justification={qa2Ratings?.[currentKey]?.justification}
          isQaUser={isQaUser}
          isQa2User={isQa2User}
          isLocked={isReadOnly}
          onScoreChange={(s) => onRatingChange?.(currentKey, "score", s)}
          onJustificationChange={(t) => onRatingChange?.(currentKey, "justification", t)}
          onQa1ScoreChange={(s) => onQa1RatingChange?.(currentKey, "score", s)}
          onQa1JustificationChange={(t) => onQa1RatingChange?.(currentKey, "justification", t)}
          onQa2ScoreChange={(s) => onQa2RatingChange?.(currentKey, "score", s)}
          onQa2JustificationChange={(t) => onQa2RatingChange?.(currentKey, "justification", t)}
        />

        {/* Prev / Next */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setActiveTab((p) => Math.max(0, p - 1))} disabled={activeTab === 0}
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
          <button onClick={() => setActiveTab((p) => Math.min(modelKeys.length - 1, p + 1))} disabled={activeTab === modelKeys.length - 1}
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
  );
}