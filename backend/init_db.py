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
        # Check if users already exist
        existing_doctor = db.query(User).filter(User.username == "drrauf").first()
        if not existing_doctor:
            print("Seeding initial Doctor user (Dr. Rauf)...")
            doctor_user = User(
                email="doctor@neurology.pk",
                username="drrauf",
                full_name="Dr. Rauf",
                role=UserRole.DOCTOR,
                hashed_password=get_password_hash("Doctor@123"),
                is_active=True
            )
            db.add(doctor_user)
        else:
            print("Doctor user already exists.")

        existing_admin = db.query(User).filter(User.username == "admin").first()
        if not existing_admin:
            print("Seeding initial Admin user...")
            admin_user = User(
                email="admin@neurology.pk",
                username="admin",
                full_name="System Administrator",
                role=UserRole.ADMIN,
                hashed_password=get_password_hash("Admin@123"),
                is_active=True
            )
            db.add(admin_user)
        else:
            print("Admin user already exists.")

        existing_staff = db.query(User).filter(User.username == "staff").first()
        if not existing_staff:
            print("Seeding initial Staff user...")
            staff_user = User(
                email="staff@neurology.pk",
                username="staff",
                full_name="Clinic Receptionist",
                role=UserRole.STAFF,
                hashed_password=get_password_hash("Staff@123"),
                is_active=True
            )
            db.add(staff_user)
        else:
            print("Staff user already exists.")

        db.commit()

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
