import { getSession } from "@/lib/auth";
import { fetchAllTasks } from "@/lib/tasks";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import TaskCard from "@/components/TaskCard";

export default async function TasksPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const tasks = await fetchAllTasks(session.username);
  const total = tasks.length;
  const submitted = tasks.filter((t) => t.is_submitted).length;
  const progress = total > 0 ? (submitted / total) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <Navbar username={session.username} />

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8 animate-in">
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-bold text-white mb-1">
            My Tasks
          </h1>
          <p className="text-sm text-[#9898a8]">
            Annotation queue · {total} total tasks
          </p>
        </div>

        {/* Progress bar */}
        <div className="bg-[#111113] border border-[#2e2e38] rounded-xl p-5 mb-8 animate-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#9898a8]">Overall Progress</span>
            <span className="text-sm font-medium text-white">
              {submitted} / {total}
            </span>
          </div>
          <div className="h-2 bg-[#2e2e38] rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-[#5c5c72]">
              {progress.toFixed(0)}% complete
            </span>
            <span className="text-xs text-[#5c5c72]">
              {total - submitted} remaining
            </span>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#18181c] border border-[#2e2e38] text-[#9898a8]">
            All ({total})
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
            Done ({submitted})
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
            Pending ({total - submitted})
          </span>
        </div>

        {/* Task list */}
        {tasks.length === 0 ? (
          <div className="text-center py-20 text-[#5c5c72]">
            <svg className="w-10 h-10 mx-auto mb-4 opacity-40" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9 12h6M9 8h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-sm">No tasks allocated to your account.</p>
          </div>
        ) : (
          <div className="space-y-3 animate-in">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
