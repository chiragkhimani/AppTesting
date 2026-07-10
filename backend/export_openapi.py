"""Export OpenAPI (Swagger) spec from the FastAPI app to openapi.json."""
import json
import os
from pathlib import Path

# Minimal env so server module can import without a live MongoDB connection.
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "qa_demo_store")

from server import app  # noqa: E402

OUT = Path(__file__).parent / "openapi.json"

if __name__ == "__main__":
    spec = app.openapi()
    OUT.write_text(json.dumps(spec, indent=2), encoding="utf-8")
    print(f"Wrote {OUT}")
