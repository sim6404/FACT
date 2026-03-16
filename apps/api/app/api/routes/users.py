from fastapi import APIRouter

from app.schemas.domain import RoleRead, UserRead
from app.services.users import get_current_user, list_roles, list_users

router = APIRouter()


@router.get("/me", response_model=UserRead)
def get_me():
    return get_current_user()


@router.get("/users", response_model=list[UserRead])
def get_users():
    return list_users()


@router.get("/roles", response_model=list[RoleRead])
def get_roles():
    return list_roles()
