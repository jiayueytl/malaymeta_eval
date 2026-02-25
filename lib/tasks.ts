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
  qa: { flag: string; feedback: string; status: string }
): Promise<void> {
  await query(
    `UPDATE data.annotation_tasks
     SET ratings     = $1,
         qa1_flag    = $2,
         qa1_feedback= $3,
         qa1_status  = $4,
         is_submitted= TRUE
     WHERE id = $5 AND username = $6`,
    [JSON.stringify(ratings), qa.flag, qa.feedback, qa.status, taskId, username]
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
