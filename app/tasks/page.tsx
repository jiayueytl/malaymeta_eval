import { getSession, getQaUsers, getQa1Users, getQa2Users } from "@/lib/auth";
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
  const isQaUser = getQaUsers().includes(session.username.toLowerCase());
  const isQa2User = getQa2Users().includes(session.username.toLowerCase());

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Navbar username={session.username} isQaUser={isQaUser} isQa2User={isQa2User} />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8 animate-in">
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-2xl font-bold text-gray-900 mb-1">
            My Tasks
          </h1>
          <p className="text-sm text-black-400">Annotation queue · {total} total tasks</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8 animate-in shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Overall Progress</span>
            <span className="text-sm font-medium text-gray-900">{submitted} / {total}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-black-400">{progress.toFixed(0)}% complete</span>
            <span className="text-xs text-black-400">{total - submitted} remaining</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-500">All ({total})</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-600">Done ({submitted})</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-600">Pending ({total - submitted})</span>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-20 text-gray-300">
            <p className="text-sm">No tasks allocated to your account.</p>
          </div>
        ) : (
          <div className="space-y-3 animate-in">
            {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        )}
      </main>
    </div>
  );
}