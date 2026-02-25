import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchTaskById, updateTask } from "@/lib/tasks";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await fetchTaskById(id);

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Ensure user can only see their own tasks
  if (task.username !== session.username)
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

  // Validate task belongs to user
  const task = await fetchTaskById(id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (task.username !== session.username)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await updateTask(id, session.username, ratings, qa);
  return NextResponse.json({ ok: true });
}
