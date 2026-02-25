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

const SCORE_LABELS: Record<number, 

{ label: string; color: string; bg: string; border: string; hover: string }> = {
  0: { label: "Completely incorrect", color: "text-red-600",    bg: "bg-red-50",    border: "border-red-300",    hover: "hover:bg-red-50    hover:border-red-300    hover:text-red-600" },
  1: { label: "Major Errors, Still Understandable",         color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-300", hover: "hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600" },
  2: { label: "Mostly Correct but Not Natural",   color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-300", hover: "hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-600" },
  3: { label: "Accurate but Style Not fully Captured",         color: "text-green-600",  bg: "bg-green-50",  border: "border-green-300",  hover: "hover:bg-green-50  hover:border-green-300  hover:text-green-600" },
  4: { label: "Excellent Translation",      color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-300",   hover: "hover:bg-blue-50   hover:border-blue-300   hover:text-blue-600" },
};

export default function ModelRatingTab({
  uiName, content, score, justification, onScoreChange, onJustificationChange,
}: ModelRatingTabProps) {
  return (
    <div className="space-y-5 animate-in">
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium text-black-400 uppercase tracking-widest mb-3" style={{ fontFamily: "var(--font-mono)" }}>
          {uiName} Output
        </p>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>

      <div>
        <p className="text-xs font-medium text-black-400 uppercase tracking-widest mb-3">Quality Score</p>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((s) => {
            const active = score === s;
            const meta = SCORE_LABELS[s];
            return (
              <button
                key={s}
                onClick={() => onScoreChange(s)}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all duration-150 ${
                    active
                      ? `${meta.bg} ${meta.border} ${meta.color} shadow-sm`
                      : `bg-white border-gray-200 text-gray-400 ${meta.hover}`
                  }`}
              >
                <span className="block text-lg leading-none mb-1">{s}</span>
                <span className={`text-[10px] ${active ? meta.color : "text-black-400"}`}>
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-black-400 uppercase tracking-widest block mb-2">Justification</label>
        <textarea
          rows={3}
          value={justification}
          onChange={(e) => onJustificationChange(e.target.value)}
          placeholder="Explain your rating…"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 transition-all resize-none"
        />
      </div>
    </div>
  );
}