"use client";
import { useState } from "react";
import { MODEL_MAP } from "@/types";

type QaRatings = Record<string, { justification: string }>;

interface QaModelPanelProps {
  modelKeys: string[];
  qaRatings: QaRatings;
  onUpdate?: (key: string, val: string) => void;
  colorClass: "indigo" | "purple" | "amber";
  placeholderPrefix: string;
  readOnly?: boolean;
}

export default function QaModelPanel({
  modelKeys,
  qaRatings,
  onUpdate,
  colorClass,
  placeholderPrefix,
  readOnly = false,
}: QaModelPanelProps) {
  const [open, setOpen] = useState(false);
  const filledCount = modelKeys.filter(
    (k) => qaRatings[k]?.justification.trim().length > 0
  ).length;

  const colors = {
    indigo: {
      text: "text-indigo-500 hover:text-indigo-700",
      badge: "bg-indigo-50 border-indigo-200 text-indigo-500",
      label: "text-indigo-400",
      readonlyBg: "bg-indigo-50/40 border-indigo-100",
      textareaBg: "bg-indigo-50/50 border-indigo-200 placeholder:text-indigo-200 focus:border-indigo-400",
    },
    purple: {
      text: "text-purple-500 hover:text-purple-700",
      badge: "bg-purple-50 border-purple-200 text-purple-500",
      label: "text-purple-400",
      readonlyBg: "bg-purple-50/40 border-purple-100",
      textareaBg: "bg-purple-50/50 border-purple-200 placeholder:text-purple-200 focus:border-purple-400",
    },
    amber: {
      text: "text-amber-500 hover:text-amber-700",
      badge: "bg-amber-50 border-amber-200 text-amber-500",
      label: "text-amber-400",
      readonlyBg: "bg-amber-50/40 border-amber-100",
      textareaBg: "bg-amber-50/50 border-amber-200 placeholder:text-amber-200 focus:border-amber-400",
    },
  }[colorClass];

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 text-xs font-medium transition-colors ${colors.text}`}
      >
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`transition-transform ${open ? "rotate-90" : ""}`}
        >
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Per-model justifications
        <span className={`px-1.5 py-0.5 rounded text-[10px] border ${colors.badge}`}>
          {filledCount}/{modelKeys.length}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {modelKeys.map((key) => (
            <div key={key} className="flex gap-3 items-start">
              <span
                className={`text-[10px] pt-2.5 shrink-0 w-20 text-right ${colors.label}`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {MODEL_MAP[key]}
              </span>
              {readOnly ? (
                <p className={`flex-1 text-xs text-gray-500 border rounded-xl px-3 py-2 min-h-[36px] ${colors.readonlyBg}`}>
                  {qaRatings[key]?.justification || (
                    <span className="text-gray-300 italic">No justification</span>
                  )}
                </p>
              ) : (
                <textarea
                  rows={2}
                  value={qaRatings[key]?.justification ?? ""}
                  onChange={(e) => onUpdate?.(key, e.target.value)}
                  placeholder={`${placeholderPrefix} notes for ${MODEL_MAP[key]}…`}
                  className={`flex-1 border rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none transition-all resize-none ${colors.textareaBg}`}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}