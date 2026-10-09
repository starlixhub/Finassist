import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent
for p in [str(project_root), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.main import app
from backend.db.database import db_service

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

client = TestClient(app)

print("=" * 70)
print("TESTING ANOMALY SPOTLIGHT ENDPOINT (/anomaly-spotlight)")
print("=" * 70)

# 1. Reset user 1 and ingest demo.csv
db_service.clear_user_data(1)
client.post("/api/income", json={"user_id": 1, "monthly_income": 45000})

demo_csv_path = project_root / "data" / "demo.csv"
with open(demo_csv_path, "rb") as f:
    upload_res = client.post(
        "/api/transactions/upload",
        files={"file": ("demo.csv", f.read(), "text/csv")},
        data={"user_id": 1}
    )
print(f"Uploaded demo.csv: {upload_res.json()}")

# 2. Test GET /anomaly-spotlight?user_id=1 (root mount)
res_root = client.get("/anomaly-spotlight?user_id=1")
print(f"\nRoot /anomaly-spotlight Status: {res_root.status_code}")
data_root = res_root.json()
print("Response:")
import json
print(json.dumps(data_root, indent=2))

# 3. Test GET /api/anomaly-spotlight?user_id=1 (/api mount)
res_api = client.get("/api/anomaly-spotlight?user_id=1")
print(f"\nAPI /api/anomaly-spotlight Status: {res_api.status_code}")
assert res_api.status_code == 200

# 4. Verify the planted anomaly row was surfaced
tx = data_root.get("transaction", {})
assert tx is not None, "Expected transaction object in response"
print(f"\nSurfaced Anomaly Description: {tx.get('description')}")
print(f"Amount: {tx.get('amount')}")
print(f"Deviation %: {data_root.get('deviation_pct')}%")
print(f"Explanation: {data_root.get('explanation')}")

assert "laptop" in tx.get("description", "").lower() or "motherboard" in tx.get("description", "").lower(), \
    f"Expected planted laptop motherboard repair anomaly, got {tx.get('description')}"
assert abs(tx.get("amount", 0.0)) == 28500.0, f"Expected 28500 amount, got {tx.get('amount')}"
assert data_root.get("deviation_pct", 0) > 50, "Expected significant deviation"
assert len(data_root.get("explanation", "")) > 10, "Expected non-empty explanation"

# 5. Test empty user (zero transactions)
res_empty = client.get("/api/anomaly-spotlight?user_id=8888")
print(f"\nEmpty user Status: {res_empty.status_code}")
print(f"Empty user Response: {res_empty.json()}")
assert res_empty.status_code == 200
assert res_empty.json()["transaction"] is None

print("\n" + "=" * 70)
print("ANOMALY SPOTLIGHT VERIFICATION PASSED 100%!")
print("=" * 70)
