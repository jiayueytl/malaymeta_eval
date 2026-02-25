import { getSession, getQaUsers } from "@/lib/auth";
import { fetchTaskById, fetchAllTasks } from "@/lib/tasks";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import TaskDetailClient from "./TaskDetailClient";


// function getQaUsers(): string[] {
//   return (process.env.QA_USERS ?? "")
//     .split(",")
//     .map((u) => u.trim().toLowerCase())
//     .filter(Boolean);
// }

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const [task, allTasks] = await Promise.all([
    fetchTaskById(id),
    fetchAllTasks(session.username),
  ]);

  if (!task) notFound();
  if (task.username !== session.username) redirect("/tasks");

  // Find next pending task after current one (by row_num)
  const nextPending = allTasks.find(
    (t) => !t.is_submitted && t.id !== id && t.row_num > (task.row_num as number)
  ) ?? allTasks.find(
    (t) => !t.is_submitted && t.id !== id  // fallback: any other pending task
  ) ?? null;

  const isQaUser = getQaUsers().includes(session.username.toLowerCase());
  const taskBriefUrl = process.env.TASK_BRIEF_URL ?? "https://onedrive.live.com/placeholder";

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Navbar username={session.username} />
      <TaskDetailClient
        task={task}
        isQaUser={isQaUser}
        taskBriefUrl={taskBriefUrl}
        nextPendingId={nextPending?.id ?? null}
      />
    </div>
  );
}