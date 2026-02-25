import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchAllTasks } from "@/lib/tasks";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await fetchAllTasks(session.username);
  return NextResponse.json(tasks);
}
