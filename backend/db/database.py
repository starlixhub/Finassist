import os
import sqlite3
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from supabase import create_client, Client

logger = logging.getLogger("finassist.db")

# Load environment variables from .env in backend/ or root
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# Initialize Supabase client if configured
supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        logger.warning(f"Failed to initialize Supabase client: {e}")

# SQLite Local Database Setup (for local dev, tests, and fallback)
SQLITE_DB_PATH = Path(__file__).resolve().parent.parent / "finassist.db"

def init_sqlite_db():
    """Ensure SQLite database and tables exist for offline/fallback mode."""
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            name TEXT,
            monthly_income REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            description TEXT,
            amount REAL NOT NULL,
            category TEXT,
            raw_row TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            target_amount REAL NOT NULL,
            target_months INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            predicted_date TEXT,
            predicted_balance REAL NOT NULL,
            risk_level TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_user_cat ON transactions(user_id, category);")
    conn.commit()
    conn.close()

# Initialize SQLite tables on startup
init_sqlite_db()


class DatabaseService:
    """
    Unified database service supporting Supabase Postgres with transparent
    SQLite fallback if Supabase tables haven't been migrated yet.
    """

    @staticmethod
    def get_user(user_id: int) -> Optional[Dict[str, Any]]:
        if supabase:
            try:
                res = supabase.table("users").select("*").eq("id", user_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.info(f"Supabase get_user fallback to SQLite: {e}")

        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, monthly_income, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @staticmethod
    def upsert_user(user_id: int, monthly_income: float, name: Optional[str] = None) -> Dict[str, Any]:
        user_name = name or f"User {user_id}"
        supabase_ok = False

        if supabase:
            try:
                # Check user existence
                user_res = supabase.table("users").select("id").eq("id", user_id).execute()
                if user_res.data and len(user_res.data) > 0:
                    res = supabase.table("users").update({
                        "monthly_income": monthly_income
                    }).eq("id", user_id).execute()
                else:
                    res = supabase.table("users").insert({
                        "id": user_id,
                        "monthly_income": monthly_income,
                        "name": user_name
                    }).execute()
                if res.data:
                    supabase_ok = True
            except Exception as e:
                logger.info(f"Supabase upsert_user fallback to SQLite: {e}")

        # Always keep SQLite in sync
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        exists = cursor.fetchone()
        if exists:
            cursor.execute("UPDATE users SET monthly_income = ? WHERE id = ?", (monthly_income, user_id))
        else:
            cursor.execute("INSERT INTO users (id, name, monthly_income) VALUES (?, ?, ?)", (user_id, user_name, monthly_income))
        conn.commit()
        conn.close()

        return {"id": user_id, "name": user_name, "monthly_income": monthly_income}

    @staticmethod
    def insert_transactions(rows: List[Dict[str, Any]]) -> int:
        if not rows:
            return 0

        # Ensure user exists in SQLite and Supabase
        user_ids = {r["user_id"] for r in rows}
        for uid in user_ids:
            DatabaseService.get_or_create_user(uid)

        inserted_count = len(rows)

        if supabase:
            try:
                # Batch in chunks of 100
                batch_size = 100
                for i in range(0, len(rows), batch_size):
                    chunk = rows[i:i + batch_size]
                    supabase.table("transactions").insert(chunk).execute()
            except Exception as e:
                logger.info(f"Supabase insert_transactions fallback to SQLite: {e}")

        # Sync to SQLite
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        for r in rows:
            cursor.execute("""
                INSERT INTO transactions (user_id, date, description, amount, category, raw_row)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (r["user_id"], str(r["date"]), r["description"], r["amount"], r["category"], r.get("raw_row", "")))
        conn.commit()
        conn.close()

        return inserted_count

    @staticmethod
    def get_transactions(user_id: int) -> List[Dict[str, Any]]:
        if supabase:
            try:
                res = (
                    supabase.table("transactions")
                    .select("id, date, description, amount, category, raw_row")
                    .eq("user_id", user_id)
                    .order("date", desc=False)
                    .execute()
                )
                if res.data is not None and len(res.data) > 0:
                    return res.data
            except Exception as e:
                logger.info(f"Supabase get_transactions fallback to SQLite: {e}")

        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, user_id, date, description, amount, category, raw_row
            FROM transactions
            WHERE user_id = ?
            ORDER BY date ASC
        """, (user_id,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def upsert_goal(user_id: int, target_amount: float, target_months: int) -> Dict[str, Any]:
        """Insert or update a savings goal for the user."""
        DatabaseService.get_or_create_user(user_id)
        goal_id = 1

        if supabase:
            try:
                res = supabase.table("goals").insert({
                    "user_id": user_id,
                    "target_amount": target_amount,
                    "target_months": target_months
                }).execute()
                if res.data and len(res.data) > 0:
                    goal_id = res.data[0].get("id", 1)
            except Exception as e:
                logger.info(f"Supabase upsert_goal fallback to SQLite: {e}")

        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO goals (user_id, target_amount, target_months)
            VALUES (?, ?, ?)
        """, (user_id, target_amount, target_months))
        goal_id = cursor.lastrowid or goal_id
        conn.commit()
        conn.close()

        return {
            "id": goal_id,
            "goal_id": goal_id,
            "user_id": user_id,
            "target_amount": target_amount,
            "target_months": target_months
        }

    @staticmethod
    def get_latest_goal(user_id: int) -> Optional[Dict[str, Any]]:
        """Retrieve the latest savings goal for user_id."""
        if supabase:
            try:
                res = (
                    supabase.table("goals")
                    .select("*")
                    .eq("user_id", user_id)
                    .order("created_at", desc=True)
                    .limit(1)
                    .execute()
                )
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.info(f"Supabase get_latest_goal fallback to SQLite: {e}")

        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, user_id, target_amount, target_months, created_at
            FROM goals
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 1
        """, (user_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @staticmethod
    def insert_prediction(user_id: int, predicted_date: Optional[str], predicted_balance: float, risk_level: str) -> Dict[str, Any]:
        """Record a calculated prediction in the predictions table."""
        DatabaseService.get_or_create_user(user_id)

        if supabase:
            try:
                supabase.table("predictions").insert({
                    "user_id": user_id,
                    "predicted_date": predicted_date,
                    "predicted_balance": predicted_balance,
                    "risk_level": risk_level
                }).execute()
            except Exception as e:
                logger.info(f"Supabase insert_prediction fallback to SQLite: {e}")

        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO predictions (user_id, predicted_date, predicted_balance, risk_level)
            VALUES (?, ?, ?, ?)
        """, (user_id, predicted_date, predicted_balance, risk_level))
        pred_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return {
            "id": pred_id,
            "user_id": user_id,
            "predicted_date": predicted_date,
            "predicted_balance": predicted_balance,
            "risk_level": risk_level
        }

    @staticmethod
    def clear_user_data(user_id: int):
        """Helper to clear test data for a given user_id."""
        if supabase:
            try:
                supabase.table("transactions").delete().eq("user_id", user_id).execute()
                supabase.table("goals").delete().eq("user_id", user_id).execute()
                supabase.table("predictions").delete().eq("user_id", user_id).execute()
                supabase.table("users").delete().eq("id", user_id).execute()
            except Exception as e:
                logger.info(f"Supabase clear_user_data fallback to SQLite: {e}")

        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM goals WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM predictions WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()

    @staticmethod
    def get_or_create_user(user_id: int) -> Dict[str, Any]:
        existing = DatabaseService.get_user(user_id)
        if existing:
            return existing
        return DatabaseService.upsert_user(user_id, monthly_income=0.0)

db_service = DatabaseService()
