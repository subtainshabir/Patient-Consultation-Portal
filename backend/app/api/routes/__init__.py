from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.patients import router as patients_router
from app.api.routes.master_data import router as master_data_router
from app.api.routes.consultations import router as consultations_router
from app.api.routes.admin import router as admin_router
from app.api.routes.dashboard import router as dashboard_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(patients_router)
api_router.include_router(master_data_router)
api_router.include_router(consultations_router)
api_router.include_router(admin_router)
api_router.include_router(dashboard_router)

__all__ = ["api_router"]

