import { getSession, getQaUsers, getQa1Users, getQa2Users } from "@/lib/auth";
import { fetchAllTasks } from "@/lib/tasks";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import TaskCard from "@/components/TaskCard";
import TasksClient from "@/components/TasksClient";

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

      <TasksClient tasks={tasks} />
    </div>
  );
}