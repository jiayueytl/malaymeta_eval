import { getSession, getQaUsers, getQa1Users, getQa2Users } from "@/lib/auth";
import { fetchTaskById, fetchAllTasks } from "@/lib/tasks";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import TaskDetailClient from "./TaskDetailClient";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const qa1Users = getQa1Users();
  const qa2Users = getQa2Users();
  const allQaUsers = getQaUsers();
  const username = session.username.toLowerCase();

  const isQaUser = allQaUsers.includes(username);
  const isQa2User = qa2Users.includes(username);
  const isQa1User = qa1Users.includes(username);

  const task = await fetchTaskById(id);
  if (!task) notFound();

  // Annotators can only see their own tasks
  // QA1 can only see tasks assigned to them via qa1_username
  // QA2 can see everything
  if (!isQa2User) {
    if (isQa1User) {
      if ((task.qa1_username as string) !== session.username) redirect("/tasks");
    } else {
      if (task.username !== session.username) redirect("/tasks");
    }
  }

  // Find next pending task for navigation
  const allTasks = await fetchAllTasks(session.username);
  const nextPending = allTasks.find(
    (t) => !t.is_submitted && t.id !== id && t.row_num > (task.row_num as number)
  ) ?? allTasks.find(
    (t) => !t.is_submitted && t.id !== id
  ) ?? null;

  const taskBriefUrl = process.env.TASK_BRIEF_URL ?? "https://onedrive.live.com/placeholder";

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Navbar username={session.username} isQaUser={isQaUser} isQa2User={isQa2User} />
      <TaskDetailClient
        task={task}
        isQaUser={isQaUser}
        isQa2User={isQa2User}
        taskBriefUrl={taskBriefUrl}
        nextPendingId={nextPending?.id ?? null}
      />
    </div>
  );
}