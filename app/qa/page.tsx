import { getSession, getQa1Users, getQa2Users, getQaUsers } from "@/lib/auth";
import { fetchAllTasksGrouped, fetchAllTasksGroupedForQa1 } from "@/lib/tasks";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import QaDashboardClient from "./QaDashboardClient";

export default async function QAPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const qa1Users = getQa1Users();
  const qa2Users = getQa2Users();
  const allQaUsers = getQaUsers();

  const username = session.username.toLowerCase();
  if (!allQaUsers.includes(username)) redirect("/tasks");

  const isQa2 = qa2Users.includes(username);
  const isQa1 = qa1Users.includes(username);

  // QA2 sees everyone grouped by real username
  // QA1 sees only their assigned tasks, annotator names masked
  const grouped = isQa2
    ? await fetchAllTasksGrouped()
    : await fetchAllTasksGroupedForQa1(session.username);

  const totalAll = Object.values(grouped).reduce((s, t) => s + t.length, 0);
  const submittedAll = Object.values(grouped).reduce((s, t) => s + t.filter((x) => x.is_submitted).length, 0);

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Navbar username={session.username} isQaUser={true} isQa2User={isQa2} />
      <QaDashboardClient
        grouped={grouped}
        totalAll={totalAll}
        submittedAll={submittedAll}
        isQa2={isQa2}
        qa1Users={qa1Users}
        currentUsername={session.username}
      />
    </div>
  );
}