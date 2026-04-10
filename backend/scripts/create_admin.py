#!/usr/bin/env python3
"""
Create the initial admin user (or promote an existing user to admin).

Usage:
    cd backend
    python scripts/create_admin.py <email> <name> <password>

Example:
    python scripts/create_admin.py admin@company.com "Alice Admin" MySecretPass123
"""
import sys
import os

# Add the backend root to sys.path so app imports work without installation
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Ensure the DB directory exists before importing anything that touches SQLAlchemy
from pathlib import Path
from app.core.settings import settings

settings.DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

from app.db.database import SessionLocal, engine, Base

# Import all models so create_all registers them
import app.models.user          # noqa: F401
import app.models.category      # noqa: F401
import app.models.meeting_host  # noqa: F401
import app.models.meeting_link  # noqa: F401
import app.models.sync_log      # noqa: F401

Base.metadata.create_all(bind=engine)

from app.models.user import User
from app.core.security import get_password_hash


def create_admin(email: str, name: str, password: str) -> None:
    db = SessionLocal()
    try:
        email = email.lower().strip()
        existing = db.query(User).filter(User.email == email).first()

        if existing:
            if existing.role == "admin":
                print(f"[INFO] '{email}' is already an admin.")
            else:
                existing.role = "admin"
                existing.is_active = True
                existing.hashed_password = get_password_hash(password)
                db.commit()
                print(f"[OK] Existing user '{email}' promoted to admin and password updated.")
            return

        admin = User(
            email=email,
            name=name.strip(),
            hashed_password=get_password_hash(password),
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"[OK] Admin user '{email}' created successfully.")
    except Exception as exc:
        db.rollback()
        print(f"[ERROR] {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(1)

    _, email_arg, name_arg, password_arg = sys.argv

    if len(password_arg) < 8:
        print("[ERROR] Password must be at least 8 characters.", file=sys.stderr)
        sys.exit(1)

    create_admin(email_arg, name_arg, password_arg)
