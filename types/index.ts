export interface Task extends Record<string, unknown> {
  notes: string;
  id: string;
  row_num: number;
  username: string;
  original_text: string;
  language: string;
  reference: string;
  url: string;
  is_submitted: boolean;
  ratings: Record<string, { score: number; justification: string }> | null;
  qa1_flag: string | null;
  qa1_feedback: string | null;
  qa1_status: string | null;
  // Model columns
  gemini_3_pro_preview: string;
  gpt_5_2_2025_12_11: string;
  doubao_seed_1_8_251228: string;
  qwen3_235b_a22b_thinking_2507: string;
  kimi_k2_0905_preview: string;
  glm_4_7: string;
  minimax_m2_1: string;
  qwen3_235b_a22b_instruct_2507: string;
  qwen3_max_2026_01_23: string;
  claude_sonnet_4_5_20250929_thinking: string;
  deepseek_chat_official: string;
  gemini_2_5_flash: string;
  glm_4_5_air: string;
}

export interface TaskSummary {
  id: string;
  row_num: number;
  original_text: string;
  is_submitted: boolean;
}

export const MODEL_MAP: Record<string, string> = {
  gemini_3_pro_preview: "Model 1",
  gpt_5_2_2025_12_11: "Model 2",
  doubao_seed_1_8_251228: "Model 3",
  qwen3_235b_a22b_thinking_2507: "Model 4",
  kimi_k2_0905_preview: "Model 5",
  glm_4_7: "Model 6",
  minimax_m2_1: "Model 7",
  qwen3_235b_a22b_instruct_2507: "Model 8",
  qwen3_max_2026_01_23: "Model 9",
  claude_sonnet_4_5_20250929_thinking: "Model 10",
  deepseek_chat_official: "Model 11",
  gemini_2_5_flash: "Model 12",
  glm_4_5_air: "Model 13",
};
