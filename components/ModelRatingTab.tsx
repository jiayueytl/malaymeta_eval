"use client";

interface ModelRatingTabProps {
  modelKey: string;
  uiName: string;
  content: string;
  // Annotator
  score: number;
  justification: string;
  // QA1
  qa1Score?: number;
  qa1Justification?: string;
  // QA2
  qa2Score?: number;
  qa2Justification?: string;
  // Flags
  isQaUser?: boolean;
  isQa2User?: boolean;
  isLocked?: boolean;
  // Callbacks
  onScoreChange: (score: number) => void;
  onJustificationChange: (text: string) => void;
  onQa1ScoreChange?: (score: number) => void;
  onQa1JustificationChange?: (text: string) => void;
  onQa2ScoreChange?: (score: number) => void;
  onQa2JustificationChange?: (text: string) => void;
}

const SCORE_LABELS: Record<number, { label: string; color: string; bg: string; border: string; hover: string }> = {
  0: { label: "Completely incorrect",                  color: "text-red-600",    bg: "bg-red-50",    border: "border-red-300",    hover: "hover:bg-red-50    hover:border-red-300    hover:text-red-600" },
  1: { label: "Major Errors, Still Understandable",    color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-300", hover: "hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600" },
  2: { label: "Mostly Correct but Not Natural",        color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-300", hover: "hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-600" },
  3: { label: "Accurate but Style Not fully Captured", color: "text-green-600",  bg: "bg-green-50",  border: "border-green-300",  hover: "hover:bg-green-50  hover:border-green-300  hover:text-green-600" },
  4: { label: "Excellent Translation",                 color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-300",   hover: "hover:bg-blue-50   hover:border-blue-300   hover:text-blue-600" },
};

function ScoreButtons({
  score,
  disabled = false,
  onChange,
}: {
  score: number;
  disabled?: boolean;
  onChange: (s: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {[0, 1, 2, 3, 4].map((s) => {
        const active = score === s;
        const meta = SCORE_LABELS[s];
        return (
          <button key={s} disabled={disabled} onClick={() => onChange(s)}
            className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
              active
                ? `${meta.bg} ${meta.border} ${meta.color} shadow-sm`
                : `bg-white border-gray-200 text-gray-400 ${meta.hover}`
            }`}
          >
            <span className="block text-lg leading-none mb-1">{s}</span>
            <span className={`text-[10px] ${active ? meta.color : "text-gray-400"}`}>{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function ModelRatingTab({
  uiName, content,
  score, justification,
  qa1Score, qa1Justification,
  qa2Score, qa2Justification,
  isQaUser, isQa2User, isLocked,
  onScoreChange, onJustificationChange,
  onQa1ScoreChange, onQa1JustificationChange,
  onQa2ScoreChange, onQa2JustificationChange,
}: ModelRatingTabProps) {
  return (
    <div className="space-y-5 animate-in">

      {/* Model output */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3" style={{ fontFamily: "var(--font-mono)" }}>
          {uiName} Output
        </p>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>

      {/* ── Annotator score + justification ── */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Quality Score</p>
        <ScoreButtons score={score} disabled={isLocked} onChange={onScoreChange} />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-400 uppercase tracking-widest block mb-2">Justification</label>
        <textarea rows={3} value={justification} disabled={isLocked}
          onChange={(e) => onJustificationChange(e.target.value)}
          placeholder="Explain your rating…"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* ── QA1 score + justification (visible to QA users) ── */}
      {isQaUser && (
        <div className="border-t border-dashed border-indigo-200 pt-5 space-y-3">
          <p className="text-xs font-medium text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
            QA1 Score
          </p>
          <ScoreButtons
            score={qa1Score ?? 0}
            onChange={(s) => onQa1ScoreChange?.(s)}
          />
          <label className="text-xs font-medium text-indigo-500 uppercase tracking-widest block mt-3">QA1 Justification</label>
          <textarea rows={2} value={qa1Justification ?? ""}
            onChange={(e) => onQa1JustificationChange?.(e.target.value)}
            placeholder="QA1 notes for this model…"
            className="w-full bg-indigo-50/50 border border-indigo-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-indigo-300 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 transition-all resize-none"
          />
        </div>
      )}

      {/* ── QA2 score + justification (editable by QA2, read-only for QA1 if filled) ── */}
      {(isQa2User || (isQaUser && (qa2Justification || qa2Score !== undefined))) && (
        <div className="border-t border-dashed border-purple-200 pt-5 space-y-3">
          <p className="text-xs font-medium text-purple-500 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
            QA2 Score
            {!isQa2User && <span className="text-[10px] text-purple-300 normal-case tracking-normal">(read-only)</span>}
          </p>
          <ScoreButtons
            score={qa2Score ?? 0}
            disabled={!isQa2User}
            onChange={(s) => onQa2ScoreChange?.(s)}
          />
          <label className="text-xs font-medium text-purple-500 uppercase tracking-widest block mt-3">
            QA2 Justification
            {!isQa2User && <span className="text-[10px] text-purple-300 normal-case tracking-normal ml-1">(read-only)</span>}
          </label>
          <textarea rows={2} value={qa2Justification ?? ""} disabled={!isQa2User}
            onChange={(e) => onQa2JustificationChange?.(e.target.value)}
            placeholder="QA2 notes for this model…"
            className="w-full bg-purple-50/50 border border-purple-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-purple-300 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      )}

    </div>
  );
}