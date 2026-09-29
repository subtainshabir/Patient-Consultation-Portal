import sys
import os

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def init_database():
    print("Creating database schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Phase 9.1: No hardcoded credentials or automatic default admin accounts.
        # The first administrator account is created interactively by the user via /setup
        admin_count = db.query(User).filter(User.role == UserRole.ADMIN, User.is_active == True).count()
        if admin_count == 0:
            print("No active administrator detected. First administrator account will be created via the /setup interface.")
        else:
            print(f"System has {admin_count} active administrator(s).")


        # Seed Clinical Master Data (Phase 3)
        from app.db.seed_master_data import seed_clinical_master_data
        print("Seeding clinical master data...")
        counts = seed_clinical_master_data(db)
        print(f"Clinical master data seeded: {counts}")

        print("Database initialization and user seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error initializing database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
