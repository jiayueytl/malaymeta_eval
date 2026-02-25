import { query, queryOne } from "./db";
import type { Task, TaskSummary } from "@/types";

export async function fetchAllTasks(username: string): Promise<TaskSummary[]> {
  return query<TaskSummary>(
    `SELECT id, row_num, original_text, is_submitted
     FROM data.annotation_tasks
     WHERE username = $1
     ORDER BY row_num ASC`,
    [username]
  );
}

export async function fetchTaskById(taskId: string): Promise<Task | null> {
  return queryOne<Task>(
    `SELECT * FROM data.annotation_tasks WHERE id = $1`,
    [taskId]
  );
}

export async function updateTask(
  taskId: string,
  username: string,
  ratings: Record<string, { score: number; justification: string }>,
  qa: {
    flag: string; feedback: string; status: string;
    qa1Ratings?: Record<string, { justification: string }>;
    qa2Flag?: string; qa2Feedback?: string; qa2Status?: string;
    qa2Ratings?: Record<string, { justification: string }>;
  }
): Promise<void> {
  await query(
    `UPDATE data.annotation_tasks
     SET ratings      = $1,
         qa1_flag     = $2,
         qa1_feedback = $3,
         qa1_status   = $4,
         qa1_ratings  = $5,
         qa2_flag     = $6,
         qa2_feedback = $7,
         qa2_status   = $8,
         qa2_ratings  = $9,
         is_submitted = TRUE
     WHERE id = $10 AND username = $11`,
    [
      JSON.stringify(ratings),
      qa.flag, qa.feedback, qa.status,
      JSON.stringify(qa.qa1Ratings ?? {}),
      qa.qa2Flag ?? null, qa.qa2Feedback ?? null, qa.qa2Status ?? null,
      JSON.stringify(qa.qa2Ratings ?? {}),
      taskId, username,
    ]
  );
}

export async function fetchAllTasksGrouped(): Promise<Record<string, TaskSummary[]>> {
  const rows = await query<TaskSummary & { username: string }>(
    `SELECT id, row_num, original_text, is_submitted, username
     FROM data.annotation_tasks
     ORDER BY username ASC, row_num ASC`
  );

  return rows.reduce<Record<string, TaskSummary[]>>((acc, row) => {
    const { username, ...task } = row;
    if (!acc[username]) acc[username] = [];
    acc[username].push(task);
    return acc;
  }, {});
}

export async function fetchAllTasksGroupedForQa1(qa1Username: string): Promise<Record<string, TaskSummary[]>> {
  // QA1 sees only their assigned tasks, grouped by annotator username (hidden in UI)
  const rows = await query<TaskSummary & { username: string }>(
    `SELECT id, row_num, original_text, is_submitted, username
     FROM data.annotation_tasks
     WHERE qa1_username = $1
     ORDER BY row_num ASC`,
    [qa1Username]
  );

  // Group by a masked key — QA1 cannot see real usernames
  // We use a stable index instead
  const usernameIndexMap = new Map<string, number>();
  let idx = 0;
  const grouped: Record<string, TaskSummary[]> = {};

  for (const row of rows) {
    const { username, ...task } = row;
    if (!usernameIndexMap.has(username)) {
      usernameIndexMap.set(username, ++idx);
    }
    const maskedKey = `Annotator ${usernameIndexMap.get(username)}`;
    if (!grouped[maskedKey]) grouped[maskedKey] = [];
    grouped[maskedKey].push(task);
  }

  return grouped;
}

export async function assignQa1User(taskIds: string[], qa1Username: string): Promise<void> {
  // Use unnest for bulk update
  await query(
    `UPDATE data.annotation_tasks
     SET qa1_username = $1
     WHERE id = ANY($2::uuid[])`,
    [qa1Username, taskIds]
  );
}

export async function fetchQa1Users(): Promise<string[]> {
  return (process.env.QA1_USERS ?? "")
    .split(",").map((u) => u.trim()).filter(Boolean);
}
