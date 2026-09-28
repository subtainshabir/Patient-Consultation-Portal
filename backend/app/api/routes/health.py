from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    """
    Public health check endpoint.
    Used for monitoring and deployment validation.
    """
    return {"status": "ok"}
