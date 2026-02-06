import streamlit as st
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import os
from dotenv import load_dotenv

load_dotenv()

MODEL_MAP = {
    "gemini_3_pro_preview": "Model 1",
    "gpt_5_2_2025_12_11": "Model 2",
    "doubao_seed_1_8_251228": "Model 3",
    "qwen3_235b_a22b_thinking_2507": "Model 4",
    "kimi_k2_0905_preview": "Model 5",
    "glm_4_7": "Model 6",
    "minimax_m2_1": "Model 7",
    "qwen3_235b_a22b_instruct_2507": "Model 8",
    "qwen3_max_2026_01_23": "Model 9",
    "claude_sonnet_4_5_20250929_thinking": "Model 10",
    "deepseek_chat_official": "Model 11",
    "gemini_2_5_flash": "Model 12",
    "glm_4_5_air": "Model 13"
}

def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT")
    )

def fetch_assigned_tasks(username, offset=0):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    # Fetch task based on offset to allow navigation
    cur.execute("""
        SELECT * FROM data.annotation_tasks 
        WHERE username = %s AND is_submitted = FALSE 
        ORDER BY row_num ASC 
        LIMIT 1 OFFSET %s
    """, (username, offset))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row

def update_task_sql(task_id, ratings, qa_data):
    conn = get_db_connection()
    cur = conn.cursor()
    query = """
        UPDATE data.annotation_tasks 
        SET ratings = %s, qa1_flag = %s, qa1_feedback = %s, qa1_status = %s, is_submitted = TRUE 
        WHERE id = %s
    """
    # Note: Using qa1_flag_text for PASS/FAIL string
    cur.execute(query, (json.dumps(ratings), qa_data['flag'], qa_data['feedback'], qa_data['status'], task_id))
    conn.commit()
    cur.close()
    conn.close()

def dot_login(username, password):
    url = "https://dot.ytlailabs.tech/api/v1/auth/token"
    payload = {
        'grant_type': 'password', 'username': username, 'password': password,
        'client_id': os.getenv("DOT_CLIENT_ID"), 'client_secret': os.getenv("DOT_CLIENT_SECRET")
    }
    try:
        response = requests.post(url, data=payload, timeout=10)
        return response.json().get("access_token") if response.status_code == 200 else None
    except: return None

# --- UI ---
st.set_page_config(page_title="MalayMeta Translation Eval", layout="wide")

if "token" not in st.session_state:
    st.title("🔐 Login")
    with st.form("login"):
        u = st.text_input("Username")
        p = st.text_input("Password", type="password")
        if st.form_submit_button("Login"):
            token = dot_login(u, p)
            if token:
                st.session_state.token, st.session_state.username = token, u
                st.session_state.task_offset = 0 # Initialize navigation
                st.rerun()
            else: st.error("Access Denied")
else:
    task = fetch_assigned_tasks(st.session_state.username, st.session_state.task_offset)
    
    if not task:
        st.success("No more tasks found in this direction!")
        if st.button("Go Back to Start"):
            st.session_state.task_offset = 0
            st.rerun()
    else:
        st.subheader(f"Task ID: {task['id']} | Row: {task['row_num']}")
        
        with st.expander("View Original & Reference", expanded=True):
            col_a, col_b = st.columns(2)
            col_a.info(f"**Original ({task['language']}):**\n\n{task['original_text']}")
            col_b.success(f"**Reference:**\n\n{task['reference']}")

        st.write("### Model Ranking")
        tabs = st.tabs(list(MODEL_MAP.values()))
        current_ratings = {}

        for i, (db_col, ui_name) in enumerate(MODEL_MAP.items()):
            with tabs[i]:
                st.markdown(f"**{ui_name} Translation:**")
                st.info(task[db_col])
                current_ratings[db_col] = st.radio(
                    f"Rating for {ui_name}",
                    options=[0, 1, 2, 3],
                    horizontal=True,
                    key=f"r_{task['id']}_{db_col}"
                )

        st.divider()
        
        # QA Section
        st.subheader("QA1 Review")
        c1, c2, c3 = st.columns([1, 1, 2])
        q_flag = c1.radio("QA1 Flag", options=["PASS", "FAIL"], horizontal=True)
        q_status = c2.selectbox("QA1 Status", ["pending", "approved", "rejected"])
        q_feed = c3.text_input("QA1 Feedback")

        # Navigation & Submission Footer
        st.divider()
        nav_col1, nav_col2, nav_col3 = st.columns([1, 2, 1])
        
        with nav_col1:
            if st.button("⬅️ Previous", use_container_width=True):
                if st.session_state.task_offset > 0:
                    st.session_state.task_offset -= 1
                    st.rerun()

        with nav_col2:
            if st.button("✅ Submit Annotation", type="primary", use_container_width=True):
                update_task_sql(task['id'], current_ratings, {"flag": q_flag, "status": q_status, "feedback": q_feed})
                st.toast("Submitted successfully!")
                st.rerun()

        with nav_col3:
            if st.button("Skip Next ➡️", use_container_width=True):
                st.session_state.task_offset += 1
                st.rerun()