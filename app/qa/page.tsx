import { getSession, getQaUsers } from "@/lib/auth";
import { fetchAllTasksGrouped } from "@/lib/tasks";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function QAPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!getQaUsers().includes(session.username.toLowerCase())) redirect("/tasks");

  const grouped = await fetchAllTasksGrouped();
  const usernames = Object.keys(grouped);

  const totalAll = usernames.reduce((s, u) => s + grouped[u].length, 0);
  const submittedAll = usernames.reduce((s, u) => s + grouped[u].filter((t) => t.is_submitted).length, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <Navbar username={session.username} isQaUser={true} />

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8 animate-in">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              QA Access
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-bold text-white mb-1">
            QA Dashboard
          </h1>
          <p className="text-sm text-[#9898a8]">{usernames.length} annotators · {submittedAll} / {totalAll} tasks submitted</p>
        </div>

        {/* Overall progress */}
        <div className="bg-[#111113] border border-[#2e2e38] rounded-xl p-5 mb-8 animate-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#9898a8]">Overall Annotation Progress</span>
            <span className="text-sm font-medium text-white">{submittedAll} / {totalAll}</span>
          </div>
          <div className="h-2 bg-[#2e2e38] rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${totalAll > 0 ? (submittedAll / totalAll) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Per-user sections */}
        <div className="space-y-6 animate-in">
          {usernames.map((username) => {
            const tasks = grouped[username];
            const submitted = tasks.filter((t) => t.is_submitted).length;
            const total = tasks.length;
            const pct = total > 0 ? (submitted / total) * 100 : 0;

            return (
              <div key={username} className="bg-[#111113] border border-[#2e2e38] rounded-2xl overflow-hidden">
                {/* User header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e2e38]">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-white" style={{ fontFamily: "var(--font-mono)" }}>
                      {username}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-32">
                      <div className="flex-1 h-1.5 bg-[#2e2e38] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#5c5c72] shrink-0">{submitted}/{total}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      pct === 100
                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}>
                      {pct === 100 ? "Complete" : `${total - submitted} pending`}
                    </span>
                  </div>
                </div>

                {/* Task rows */}
                <div className="divide-y divide-[#1e1e24]">
                  {tasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-[#14141a] transition-colors group"
                    >
                      <span
                        className="text-xs shrink-0 w-14 text-center px-2 py-0.5 rounded"
                        style={{ fontFamily: "var(--font-mono)", background: "#1e1e2a", color: "#6366f1", border: "1px solid #3730a3" }}
                      >
                        Row {task.row_num}
                      </span>
                      <p className="text-sm text-[#9898a8] truncate flex-1">
                        {task.original_text}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        {task.is_submitted ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400">
                            ✓ Submitted
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            ⏳ Pending
                          </span>
                        )}
                        <svg className="w-3.5 h-3.5 text-[#5c5c72] group-hover:text-indigo-400 transition-colors" viewBox="0 0 14 14" fill="none">
                          <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}