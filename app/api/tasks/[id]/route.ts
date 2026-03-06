import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchTaskById, updateTask } from "@/lib/tasks";

const getQaUsernames = () =>
  (process.env.QA_USERS ?? "").split(",").map((u) => u.trim().toLowerCase()).filter(Boolean);

const getQa2Usernames = () =>
  (process.env.QA2_USERS ?? "").split(",").map((u) => u.trim().toLowerCase()).filter(Boolean);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await fetchTaskById(id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isQa = getQaUsernames().includes(session.username.toLowerCase());

  // QA users can view any task; annotators only their own
  if (!isQa && task.username !== session.username)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(task);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { ratings, qa } = await req.json();

  const task = await fetchTaskById(id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const username = session.username.toLowerCase();
  const isQa = getQaUsernames().includes(username);
  const isQa2 = getQa2Usernames().includes(username);

  // QA users can edit any task; annotators only their own
  if (!isQa && task.username !== session.username)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Block annotator edits if task is locked by QA
  if (!isQa && task.qa1_status === "done")
    return NextResponse.json({ error: "Task is locked by QA." }, { status: 403 });

  // Block QA1 from writing qa2 fields
  if (isQa && !isQa2 && qa) {
    const { qa2Flag, qa2Feedback, qa2Status, qa2Ratings } = qa as any;
    if (qa2Flag !== undefined || qa2Feedback !== undefined || qa2Status !== undefined || qa2Ratings !== undefined)
      return NextResponse.json({ error: "QA1 cannot write QA2 fields." }, { status: 403 });
  }

  // Always use task.username (the annotator) — not session.username — so the SQL WHERE matches
  await updateTask(id, task.username as string, ratings, qa);
  return NextResponse.json({ ok: true });
}