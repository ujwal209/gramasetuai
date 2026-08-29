from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class SignUpRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    handle: str = Field(..., min_length=3, max_length=30)
    password: str = Field(..., min_length=6, max_length=100)


class LoginRequest(BaseModel):
    login_identifier: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class ResendOtpRequest(BaseModel):
    email: EmailStr
    purpose: str = "signup"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=6, max_length=100)


class FarmerProfileUpdate(BaseModel):
    name: Optional[str] = None
    handle: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    farm_location_name: Optional[str] = None
    survey_number: Optional[str] = None
    landholding_acres: Optional[float] = None
    irrigated_acres: Optional[float] = None
    soil_type: Optional[str] = None
    water_source: Optional[str] = None
    ownership_status: Optional[str] = None
    primary_crop: Optional[str] = None
    secondary_crops: Optional[str] = None
    farming_type: Optional[str] = None
    machinery_owned: Optional[str] = None
    livestock_details: Optional[str] = None
    annual_income: Optional[float] = None
    caste_category: Optional[str] = None
    special_category: Optional[str] = None
    aadhaar_dbt_linked: Optional[bool] = None
    pm_kisan_registered: Optional[bool] = None
    kcc_card_active: Optional[bool] = None
    crop_insurance_active: Optional[bool] = None
    soil_health_card_issued: Optional[bool] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    land_images: Optional[List[str]] = None
    document_images: Optional[List[str]] = None
    is_onboarded: Optional[bool] = False


class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    handle: str
    phone: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    is_verified: bool
    is_onboarded: bool = False
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    farm_location_name: Optional[str] = None
    survey_number: Optional[str] = None
    landholding_acres: Optional[float] = None
    irrigated_acres: Optional[float] = None
    soil_type: Optional[str] = None
    water_source: Optional[str] = None
    ownership_status: Optional[str] = None
    primary_crop: Optional[str] = None
    secondary_crops: Optional[str] = None
    farming_type: Optional[str] = None
    machinery_owned: Optional[str] = None
    livestock_details: Optional[str] = None
    annual_income: Optional[float] = None
    caste_category: Optional[str] = None
    special_category: Optional[str] = None
    aadhaar_dbt_linked: Optional[bool] = None
    pm_kisan_registered: Optional[bool] = None
    kcc_card_active: Optional[bool] = None
    crop_insurance_active: Optional[bool] = None
    soil_health_card_issued: Optional[bool] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    land_images: Optional[List[str]] = None
    document_images: Optional[List[str]] = None
    created_at: Optional[datetime] = None


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse
    message: str = "Authentication successful"


class GenericAuthResponse(BaseModel):
    success: bool
    message: str
    email: Optional[str] = None
