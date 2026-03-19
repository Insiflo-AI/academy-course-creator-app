from fastapi import APIRouter

from app.api.routes import ai, courses, login, private, users, utils
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
