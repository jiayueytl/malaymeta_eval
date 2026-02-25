import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getQa2Users } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const qa2Users = getQa2Users();
  if (!qa2Users.includes(session.username.toLowerCase())) {
    return NextResponse.json({ error: "Forbidden — QA2 only" }, { status: 403 });
  }

  const { taskIds, qa1Username } = await req.json();

  if (!Array.isArray(taskIds) || taskIds.length === 0 || !qa1Username) {
    return NextResponse.json({ error: "Missing taskIds or qa1Username" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    // Use individual placeholders instead of ANY($2::uuid[]) to avoid cast issues
    const placeholders = taskIds.map((_: string, i: number) => `$${i + 2}`).join(", ");
    await client.query(
      `UPDATE data.annotation_tasks SET qa1_username = $1 WHERE id IN (${placeholders})`,
      [qa1Username, ...taskIds]
    );
    return NextResponse.json({ ok: true, assigned: taskIds.length });
  } catch (err) {
    console.error("Assign error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  } finally {
    client.release();
  }
}