from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    email: str
    password: str


class MicrosoftCallbackRequest(BaseModel):
    code: str
    state: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MicrosoftLoginResponse(BaseModel):
    auth_url: str
    state: str
