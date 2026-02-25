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
    <div className="min-h-screen bg-[#f5f5f7]">
      <Navbar username={session.username} isQaUser={true} />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8 animate-in">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-600">QA Access</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-bold text-gray-900 mb-1">QA Dashboard</h1>
          <p className="text-sm text-black-400">{usernames.length} annotators · {submittedAll} / {totalAll} tasks submitted</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8 animate-in shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Overall Annotation Progress</span>
            <span className="text-sm font-medium text-gray-900">{submittedAll} / {totalAll}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${totalAll > 0 ? (submittedAll / totalAll) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="space-y-6 animate-in">
          {usernames.map((username) => {
            const tasks = grouped[username];
            const submitted = tasks.filter((t) => t.is_submitted).length;
            const total = tasks.length;
            const pct = total > 0 ? (submitted / total) * 100 : 0;

            return (
              <div key={username} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700" style={{ fontFamily: "var(--font-mono)" }}>
                      {username}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-32">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-black-400 shrink-0">{submitted}/{total}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      pct === 100
                        ? "bg-green-50 border-green-200 text-green-600"
                        : "bg-amber-50 border-amber-200 text-amber-600"
                    }`}>
                      {pct === 100 ? "Complete" : `${total - submitted} pending`}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-50">
                  {tasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <span
                        className="text-xs shrink-0 w-14 text-center px-2 py-0.5 rounded"
                        style={{ fontFamily: "var(--font-mono)", background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe" }}
                      >
                        Row {task.row_num}
                      </span>
                      <p className="text-sm text-gray-500 truncate flex-1">{task.original_text}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        {task.is_submitted ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-50 border border-green-200 text-green-600">✓ Submitted</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-600">⏳ Pending</span>
                        )}
                        <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors" viewBox="0 0 14 14" fill="none">
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