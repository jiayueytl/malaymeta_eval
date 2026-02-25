"use client";

interface ModelRatingTabProps {
  modelKey: string;
  uiName: string;
  content: string;
  score: number;
  justification: string;
  onScoreChange: (score: number) => void;
  onJustificationChange: (text: string) => void;
}

const SCORE_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "Completely incorrect", color: "text-red-400" },
  1: { label: "Major Errors, Still Understandable", color: "text-orange-400" },
  2: { label: "Mostly Correct but Not Natural", color: "text-yellow-400" },
  3: { label: "Accurate but Style Not fully Captured ", color: "text-yellow-600" },
  4: { label: "Excellent Translation  ", color: "text-green-400" },
};

export default function ModelRatingTab({
  modelKey,
  uiName,
  content,
  score,
  justification,
  onScoreChange,
  onJustificationChange,
}: ModelRatingTabProps) {
  return (
    <div className="space-y-5 animate-in">
      {/* Model output */}
      <div className="bg-[#18181c] border border-[#2e2e38] rounded-xl p-4">
        <p className="text-xs font-medium text-[#5c5c72] uppercase tracking-widest mb-3" style={{ fontFamily: "var(--font-mono)" }}>
          {uiName} Output
        </p>
        <p className="text-sm text-[#f4f4f6] leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>

      {/* Score */}
      <div>
        <p className="text-xs font-medium text-[#9898a8] uppercase tracking-widest mb-3">
          Quality Score
        </p>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((s) => (
            <button
              key={s}
              onClick={() => onScoreChange(s)}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all duration-150 ${
                score === s
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-[#18181c] border-[#2e2e38] text-[#9898a8] hover:border-indigo-500/40 hover:text-[#f4f4f6]"
              }`}
            >
              <span className="block text-lg leading-none mb-1">{s}</span>
              <span className={`text-[10px] ${score === s ? "text-indigo-200" : SCORE_LABELS[s].color} opacity-80`}>
                {SCORE_LABELS[s].label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Justification */}
      <div>
        <label className="text-xs font-medium text-[#9898a8] uppercase tracking-widest block mb-2">
          Justification
        </label>
        <textarea
          rows={3}
          value={justification}
          onChange={(e) => onJustificationChange(e.target.value)}
          placeholder="Explain your rating…"
          className="w-full bg-[#18181c] border border-[#2e2e38] rounded-xl px-4 py-3 text-sm text-[#f4f4f6] placeholder:text-[#5c5c72] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none"
        />
      </div>
    </div>
  );
}
