import { getSession, getQaUsers, getQa1Users, getQa2Users } from "@/lib/auth";
import { fetchTaskById, fetchAllTasks, fetchAllTasksForQa1 } from "@/lib/tasks";
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

  // Access control:
  // QA2  → can see any task
  // QA1  → can see any task assigned to them OR unassigned tasks
  // Annotator → can only see their own tasks
  if (isQa2User) {
    // no restriction
  } else if (isQa1User) {
    const assignedTo = task.qa1_username as string | null;
    // Block only if explicitly assigned to someone else
    if (assignedTo && assignedTo !== session.username) {
      redirect("/tasks");
    }
  } else {
    if (task.username !== session.username) redirect("/tasks");
  }

  // Find next pending task for navigation — scoped correctly per role
  let nextPending = null;
  if (isQa2User) {
    // QA2: fetch all tasks across everyone
    const { fetchAllTasksGrouped } = await import("@/lib/tasks");
    const grouped = await fetchAllTasksGrouped();
    const allTasks = Object.values(grouped).flat();
    nextPending =
      allTasks.find((t) => !t.is_submitted && t.id !== id && (t.row_num as number) > (task.row_num as number)) ??
      allTasks.find((t) => !t.is_submitted && t.id !== id) ??
      null;
  } else if (isQa1User) {
    // QA1: fetch only tasks assigned to them
    const assignedTasks = await fetchAllTasksForQa1(session.username);
    nextPending =
      assignedTasks.find((t) => !t.is_submitted && t.id !== id && (t.row_num as number) > (task.row_num as number)) ??
      assignedTasks.find((t) => !t.is_submitted && t.id !== id) ??
      null;
  } else {
    // Annotator: fetch their own tasks
    const allTasks = await fetchAllTasks(session.username);
    nextPending =
      allTasks.find((t) => !t.is_submitted && t.id !== id && (t.row_num as number) > (task.row_num as number)) ??
      allTasks.find((t) => !t.is_submitted && t.id !== id) ??
      null;
  }

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