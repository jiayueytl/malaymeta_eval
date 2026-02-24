import streamlit as st
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import os
from dotenv import load_dotenv

load_dotenv()

# ==============================
# CONFIG
# ==============================

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

# ==============================
# DATABASE
# ==============================

def get_db_connection():
    url = os.getenv("DATABASE_URL")
    if "?" in url:
        url = url.split("?")[0]
    return psycopg2.connect(url)

def fetch_all_tasks(username):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, row_num, original_text, is_submitted
        FROM data.annotation_tasks
        WHERE username = %s
        ORDER BY row_num ASC
    """, (username,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows

def fetch_task_by_id(task_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM data.annotation_tasks WHERE id = %s", (task_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row

def update_task_sql(task_id, ratings, qa_data):
    conn = get_db_connection()
    cur = conn.cursor()

    query = """
        UPDATE data.annotation_tasks 
        SET ratings = %s,
            qa1_flag = %s,
            qa1_feedback = %s,
            qa1_status = %s,
            is_submitted = TRUE
        WHERE id = %s
    """

    cur.execute(query, (
        json.dumps(ratings),
        qa_data["flag"],
        qa_data["feedback"],
        qa_data["status"],
        task_id
    ))

    conn.commit()
    cur.close()
    conn.close()

# ==============================
# AUTH
# ==============================

def dot_login(username, password):
    url = "https://dot.ytlailabs.tech/api/v1/auth/token"
    payload = {
        "grant_type": "password",
        "username": username,
        "password": password,
        "client_id": os.getenv("DOT_CLIENT_ID"),
        "client_secret": os.getenv("DOT_CLIENT_SECRET")
    }
    try:
        r = requests.post(url, data=payload, timeout=10)
        if r.status_code == 200:
            return r.json().get("access_token")
    except:
        pass
    return None

# ==============================
# SESSION RESTORE (FIX REFRESH)
# ==============================

# Try restore from URL params
params = st.query_params

if "token" not in st.session_state and "token" in params:
    st.session_state.token = params["token"]
    st.session_state.username = params["username"]
    st.session_state.page = "Task List"

# ==============================
# UI CONFIG
# ==============================

st.set_page_config(page_title="MalayMeta Translation Eval", layout="wide")

# ==============================
# LOGIN
# ==============================

if "token" not in st.session_state:

    st.title("🔐 Login")

    with st.form("login"):
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")

        if st.form_submit_button("Login"):
            token = dot_login(username, password)
            if token:
                st.session_state.token = token
                st.session_state.username = username
                st.session_state.page = "Task List"

                # Persist in URL (prevents refresh logout)
                st.query_params["token"] = token
                st.query_params["username"] = username

                st.rerun()
            else:
                st.error("Access Denied")

else:

    if "page" not in st.session_state:
        st.session_state.page = "Task List"

    st.sidebar.title(f"👤 {st.session_state.username}")

    if st.sidebar.button("📋 Task List"):
        st.session_state.page = "Task List"
        st.rerun()

    if st.sidebar.button("🚪 Logout"):
        st.session_state.clear()
        st.query_params.clear()
        st.rerun()

    # ==============================
    # TASK LIST
    # ==============================

    if st.session_state.page == "Task List":

        st.title("📋 My Allocated Tasks")

        tasks = fetch_all_tasks(st.session_state.username)

        if not tasks:
            st.info("No tasks allocated.")
        else:
            total = len(tasks)
            submitted = sum(1 for t in tasks if t["is_submitted"])

            st.progress(submitted / total)
            st.caption(f"{submitted} / {total} completed")

            for task in tasks:
                with st.container(border=True):
                    col1, col2, col3, col4 = st.columns([1, 1, 4, 1])

                    col1.write(f"Row {task['row_num']}")
                    col2.write("✅ Submitted" if task["is_submitted"] else "⏳ Pending")
                    col3.write(task["original_text"][:120] + "...")

                    if col4.button("Open", key=f"open_{task['id']}"):
                        st.session_state.selected_task_id = task["id"]
                        st.session_state.page = "Detail"
                        st.rerun()

    # ==============================
    # DETAIL PAGE
    # ==============================

    elif st.session_state.page == "Detail":

        task_id = st.session_state.get("selected_task_id")
        task = fetch_task_by_id(task_id)

        if not task:
            st.error("Task not found.")
        else:
            st.title(f"Task Row {task['row_num']}")

            if st.button("⬅ Back to List"):
                st.session_state.page = "Task List"
                st.rerun()

            col_a, col_b = st.columns(2)
            col_a.info(f"**Original ({task['language']}):**\n\n{task['original_text']}")
            col_b.success(f"**Notes:**\n\n{task['reference']}")

            st.divider()
            st.subheader("Model Evaluation")

            ratings = {}

            tabs = st.tabs(list(MODEL_MAP.values()))

            for i, (db_col, ui_name) in enumerate(MODEL_MAP.items()):
                with tabs[i]:
                    st.info(task[db_col])

                    score = st.radio(
                        f"Rating for {ui_name}",
                        [0,1,2,3],
                        horizontal=True,
                        key=f"{task_id}_{db_col}_score"
                    )

                    justification = st.text_area(
                        f"Justification for {ui_name}",
                        key=f"{task_id}_{db_col}_just"
                    )

                    ratings[db_col] = {
                        "score": score,
                        "justification": justification
                    }

            st.divider()
            st.subheader("QA1 Review")

            col1, col2, col3 = st.columns([1,1,2])
            qa_flag = col1.radio("QA1 Flag", ["PASS","FAIL"], horizontal=True)
            qa_status = col2.selectbox("QA1 Status", ["pending","approved","rejected"])
            qa_feedback = col3.text_input("QA1 Feedback")

            if st.button("✅ Submit Annotation", type="primary", use_container_width=True):

                update_task_sql(
                    task_id,
                    ratings,
                    {
                        "flag": qa_flag,
                        "status": qa_status,
                        "feedback": qa_feedback
                    }
                )

                st.toast("Submitted successfully!")
                st.session_state.page = "Task List"
                st.rerun()