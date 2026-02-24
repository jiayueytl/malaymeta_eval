-- 1. Create the user
CREATE ROLE "annotator_user" WITH LOGIN PASSWORD '6jSEolCfikEu0h4rvrs8uKok';

-- 2. Grant access to the schema 'data'
GRANT USAGE ON SCHEMA data TO "annotator_user";

-- 2. Create the table inside 'data'
CREATE TABLE data.annotation_tasks (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    row INTEGER,
    num INTEGER,
    language TEXT,
    original_text TEXT NOT NULL,
    reference TEXT,
    memo TEXT,
    url TEXT,
    -- Model Columns
    gemini_3_pro_preview TEXT,
    gpt_5_2_2025_12_11 TEXT,
    doubao_seed_1_8_251228 TEXT,
    qwen3_235b_a22b_thinking_2507 TEXT,
    kimi_k2_0905_preview TEXT,
    glm_4_7 TEXT,
    minimax_m2_1 TEXT,
    qwen3_235b_a22b_instruct_2507 TEXT,
    qwen3_max_2026_01_23 TEXT,
    claude_sonnet_4_5_20250929_thinking TEXT,
    deepseek_chat_official TEXT,
    gemini_2_5_flash TEXT,
    glm_4_5_air TEXT,
    -- Results and QA
    ratings JSONB DEFAULT '{}',
    qa1_flag BOOLEAN DEFAULT FALSE,
    qa1_feedback TEXT,
    qa1_status TEXT DEFAULT 'pending',
    is_submitted BOOLEAN DEFAULT FALSE
);
-- 3. Grant CRUD permissions on the specific table
GRANT SELECT, INSERT, UPDATE, DELETE ON data.annotation_tasks TO "annotator_user";

-- 4. Grant permission to use the ID sequence (Crucial for SERIAL/Auto-increment columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA data TO "annotator_user";

-- 5. Revoke access to 'public' schema to ensure they stay in their lane
-- REVOKE ALL ON SCHEMA public FROM "annotator_user";