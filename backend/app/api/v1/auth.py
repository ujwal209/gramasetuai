from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from app.schemas.auth import (
    SignUpRequest,
    VerifyOtpRequest,
    ResendOtpRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    FarmerProfileUpdate,
    UserProfileResponse,
    AuthTokenResponse,
    GenericAuthResponse,
)
from app.services.auth_service import auth_service, decode_access_token
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["GramSetu Authentication & Farmer Media"])


async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> UserProfileResponse:
    """
    FastAPI dependency to extract and authenticate current user from Bearer JWT header.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or token is invalid. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await auth_service.get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post(
    "/signup",
    response_model=GenericAuthResponse,
    summary="Register a new citizen/farmer account",
    description="Creates a new account and sends a 6-digit OTP verification code to citizen email via SMTP.",
)
async def signup(req: SignUpRequest):
    try:
        res = await auth_service.sign_up(req)
        return GenericAuthResponse(
            success=True,
            message=res["message"],
            email=res["email"],
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Signup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}",
        )


@router.post(
    "/verify-otp",
    response_model=AuthTokenResponse,
    summary="Verify 6-digit Email OTP",
    description="Validates OTP, activates citizen account, and issues Bearer JWT token.",
)
async def verify_otp(req: VerifyOtpRequest):
    try:
        return await auth_service.verify_otp(req)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"OTP verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {str(e)}",
        )


@router.post(
    "/resend-otp",
    response_model=GenericAuthResponse,
    summary="Resend verification or reset OTP",
)
async def resend_otp(req: ResendOtpRequest):
    try:
        res = await auth_service.resend_otp(req.email, req.otp_type)
        return GenericAuthResponse(
            success=True,
            message=res["message"],
            email=res["email"],
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resending OTP failed: {str(e)}",
        )


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    summary="Citizen & Farmer Login",
    description="Authenticate with email or @handle and password.",
)
async def login(req: LoginRequest):
    try:
        return await auth_service.login(req)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}",
        )


@router.post(
    "/forgot-password",
    response_model=GenericAuthResponse,
    summary="Request Password Reset OTP",
)
async def forgot_password(req: ForgotPasswordRequest):
    try:
        res = await auth_service.forgot_password(req.email)
        return GenericAuthResponse(
            success=True,
            message=res["message"],
            email=res["email"],
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset request failed: {str(e)}",
        )


@router.post(
    "/reset-password",
    response_model=GenericAuthResponse,
    summary="Reset Password with OTP",
)
async def reset_password(req: ResetPasswordRequest):
    try:
        res = await auth_service.reset_password(req)
        return GenericAuthResponse(
            success=True,
            message=res["message"],
            email=req.email,
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password update failed: {str(e)}",
        )


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get Authenticated User Profile",
)
async def get_my_profile(current_user: UserProfileResponse = Depends(get_current_user)):
    return current_user


@router.put(
    "/profile",
    response_model=UserProfileResponse,
    summary="Update Farmer Profile & Onboarding Info",
)
async def update_profile(
    update: FarmerProfileUpdate,
    current_user: UserProfileResponse = Depends(get_current_user),
):
    try:
        return await auth_service.update_profile(current_user.id, update)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(e)}",
        )
