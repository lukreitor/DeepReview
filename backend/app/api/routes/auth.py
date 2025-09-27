"""Authentication endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr

from app.models import User
from app.services.auth import (
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_user_by_email,
    hash_password,
)

router = APIRouter(tags=["auth"], prefix="/auth")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class UserRead(BaseModel):
    id: str
    email: EmailStr
    full_name: str | None = None
    is_active: bool

    class Config:
        from_attributes = True


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserCreate) -> TokenResponse:
    existing_user = await get_user_by_email(payload.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    await user.create()
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.post("/token", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> TokenResponse:
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email or password")
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserRead)
async def read_me(current_user: User = Depends(get_current_active_user)) -> UserRead:
    return UserRead.model_validate(current_user)


# Allow optional trailing slashes to avoid cross-origin redirect issues.
router.add_api_route(
    "/register/",
    register_user,
    methods=["POST"],
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
router.add_api_route(
    "/token/",
    login,
    methods=["POST"],
    response_model=TokenResponse,
    include_in_schema=False,
)
router.add_api_route(
    "/me/",
    read_me,
    methods=["GET"],
    response_model=UserRead,
    include_in_schema=False,
)
