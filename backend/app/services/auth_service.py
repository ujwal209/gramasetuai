import re
import uuid
import random
import string
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
import bcrypt
from bson import ObjectId
from app.core.config import settings
from app.database.mongodb import get_mongo_db, is_mongo_live, _in_memory_users
from app.schemas.auth import (
    SignUpRequest,
    VerifyOtpRequest,
    LoginRequest,
    ResetPasswordRequest,
    FarmerProfileUpdate,
    UserProfileResponse,
    AuthTokenResponse,
)
from app.services.email_service import email_service

logger = logging.getLogger(__name__)


def generate_otp() -> str:
    """Generates a 6-digit numeric OTP."""
    return "".join(random.choices(string.digits, k=6))


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, handle: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": str(user_id),
        "email": email,
        "handle": handle,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except jwt.PyJWTError as e:
        logger.debug(f"JWT decode error: {e}")
        return None


def serialize_user_doc(doc: Dict[str, Any]) -> UserProfileResponse:
    user_id = str(doc.get("_id") or doc.get("id"))
    return UserProfileResponse(
        id=user_id,
        name=doc.get("name", ""),
        email=doc.get("email", ""),
        handle=doc.get("handle", ""),
        phone=doc.get("phone"),
        gender=doc.get("gender"),
        age=doc.get("age"),
        is_verified=doc.get("is_verified", False),
        is_onboarded=doc.get("is_onboarded", False),
        state=doc.get("state"),
        district=doc.get("district"),
        village=doc.get("village"),
        pincode=doc.get("pincode"),
        latitude=doc.get("latitude"),
        longitude=doc.get("longitude"),
        farm_location_name=doc.get("farm_location_name"),
        survey_number=doc.get("survey_number"),
        landholding_acres=doc.get("landholding_acres"),
        irrigated_acres=doc.get("irrigated_acres"),
        soil_type=doc.get("soil_type"),
        water_source=doc.get("water_source"),
        ownership_status=doc.get("ownership_status"),
        primary_crop=doc.get("primary_crop"),
        secondary_crops=doc.get("secondary_crops"),
        farming_type=doc.get("farming_type"),
        machinery_owned=doc.get("machinery_owned"),
        livestock_details=doc.get("livestock_details"),
        annual_income=doc.get("annual_income"),
        caste_category=doc.get("caste_category"),
        special_category=doc.get("special_category"),
        aadhaar_dbt_linked=doc.get("aadhaar_dbt_linked"),
        pm_kisan_registered=doc.get("pm_kisan_registered"),
        kcc_card_active=doc.get("kcc_card_active"),
        crop_insurance_active=doc.get("crop_insurance_active"),
        soil_health_card_issued=doc.get("soil_health_card_issued"),
        bio=doc.get("bio"),
        avatar_url=doc.get("avatar_url"),
        land_images=doc.get("land_images") or [],
        document_images=doc.get("document_images") or [],
        created_at=doc.get("created_at"),
    )


class AuthService:
    """
    Core Authentication & Farmer Media Account Service using MongoDB with resilient fallback.
    """

    async def _find_user(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # Normalize query for MongoDB (handle ObjectId vs string _id)
        mongo_query = {}
        for k, v in query.items():
            if k == "_id":
                if isinstance(v, str) and ObjectId.is_valid(v):
                    mongo_query["$or"] = [{"_id": ObjectId(v)}, {"_id": v}, {"id": v}]
                else:
                    mongo_query[k] = v
            elif k == "$or" and isinstance(v, list):
                expanded_or = []
                for sub in v:
                    if "_id" in sub and isinstance(sub["_id"], str) and ObjectId.is_valid(sub["_id"]):
                        expanded_or.extend([{"_id": ObjectId(sub["_id"])}, {"_id": sub["_id"]}, {"id": sub["_id"]}])
                    else:
                        expanded_or.append(sub)
                mongo_query["$or"] = expanded_or
            else:
                mongo_query[k] = v

        db = get_mongo_db()
        if db is not None and is_mongo_live():
            try:
                res = await db["users"].find_one(mongo_query)
                if res:
                    return res
            except Exception as e:
                logger.warning(f"MongoDB query fallback: {e}")

        # In-memory search fallback
        for u in _in_memory_users.values():
            if "email" in query and u.get("email") == query["email"]:
                return u
            if "handle" in query and u.get("handle") == query["handle"]:
                return u
            if "_id" in query and (str(u.get("_id")) == str(query["_id"]) or str(u.get("id")) == str(query["_id"])):
                return u
            if "$or" in query:
                for sub in query["$or"]:
                    if "email" in sub and u.get("email") == sub["email"]:
                        return u
                    if "handle" in sub and u.get("handle") == sub["handle"]:
                        return u
                    if "_id" in sub and (str(u.get("_id")) == str(sub["_id"]) or str(u.get("id")) == str(sub["_id"])):
                        return u
        return None

    async def _save_user(self, user_doc: Dict[str, Any]) -> None:
        db = get_mongo_db()
        user_id = str(user_doc.get("_id") or user_doc.get("id"))
        _in_memory_users[user_id] = user_doc

        if db is not None and is_mongo_live():
            try:
                doc_id = user_doc["_id"]
                if isinstance(doc_id, str) and ObjectId.is_valid(doc_id):
                    doc_id = ObjectId(doc_id)
                await db["users"].replace_one({"_id": doc_id}, user_doc, upsert=True)
            except Exception as e:
                logger.warning(f"MongoDB save fallback: {e}")

    async def sign_up(self, req: SignUpRequest) -> Dict[str, Any]:
        email_clean = req.email.strip().lower()
        handle_clean = re.sub(r'[^a-zA-Z0-9_]', '', req.handle.strip().lower().replace('@', ''))
        if not handle_clean:
            handle_clean = f"farmer_{random.randint(1000, 9999)}"

        existing_email = await self._find_user({"email": email_clean})
        if existing_email:
            if existing_email.get("is_verified", False):
                raise ValueError("An account with this email already exists. Please log in.")
            else:
                otp = generate_otp()
                existing_email["name"] = req.name.strip()
                existing_email["handle"] = handle_clean
                existing_email["hashed_password"] = hash_password(req.password)
                existing_email["verification_otp"] = otp
                existing_email["otp_expires_at"] = datetime.now(timezone.utc) + timedelta(minutes=10)
                existing_email["updated_at"] = datetime.now(timezone.utc)
                await self._save_user(existing_email)
                await email_service.send_otp_email(email_clean, req.name, otp, purpose="verification")
                return {
                    "success": True,
                    "message": f"Verification OTP re-sent to {email_clean}. Please check your inbox.",
                    "email": email_clean,
                }

        existing_handle = await self._find_user({"handle": handle_clean})
        if existing_handle:
            raise ValueError(f"Handle @{handle_clean} is already taken. Please choose another handle.")

        otp = generate_otp()
        new_id = ObjectId()

        new_user = {
            "_id": new_id,
            "id": str(new_id),
            "name": req.name.strip(),
            "email": email_clean,
            "handle": handle_clean,
            "hashed_password": hash_password(req.password),
            "is_verified": False,
            "verification_otp": otp,
            "otp_expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
            "state": None,
            "district": None,
            "village": None,
            "primary_crop": None,
            "farming_type": "Traditional & Modern",
            "landholding_acres": None,
            "bio": "Indian citizen & farmer on GramSetu.",
            "avatar_url": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

        await self._save_user(new_user)
        logger.info(f"Registered new citizen user: {email_clean} (@{handle_clean})")

        # Deliver OTP email via SMTP
        await email_service.send_otp_email(email_clean, req.name, otp, purpose="verification")

        return {
            "success": True,
            "message": f"Account created! A 6-digit verification code was sent to {email_clean}.",
            "email": email_clean,
        }

    async def verify_otp(self, req: VerifyOtpRequest) -> AuthTokenResponse:
        email_clean = req.email.strip().lower()
        user = await self._find_user({"email": email_clean})

        if not user:
            raise ValueError("No account found with this email.")

        stored_otp = user.get("verification_otp")
        otp_exp = user.get("otp_expires_at")

        if not stored_otp or str(stored_otp).strip() != req.otp.strip():
            raise ValueError("Invalid verification OTP. Please check the code.")

        if otp_exp:
            now = datetime.now(timezone.utc)
            if otp_exp.tzinfo is None:
                otp_exp = otp_exp.replace(tzinfo=timezone.utc)
            if now > otp_exp:
                raise ValueError("Verification OTP has expired. Please request a fresh code.")

        user["is_verified"] = True
        user["verification_otp"] = None
        user["otp_expires_at"] = None
        user["updated_at"] = datetime.now(timezone.utc)
        await self._save_user(user)

        user_id = str(user.get("_id") or user.get("id"))
        token = create_access_token(user_id, user["email"], user["handle"])

        return AuthTokenResponse(
            access_token=token,
            token_type="bearer",
            user=serialize_user_doc(user),
            message="Account verified successfully! Welcome to GramSetu AI.",
        )

    async def resend_otp(self, email: str, otp_type: str = "signup") -> Dict[str, Any]:
        email_clean = email.strip().lower()
        user = await self._find_user({"email": email_clean})

        if not user:
            raise ValueError("No account found with this email address.")

        otp = generate_otp()
        otp_exp = datetime.now(timezone.utc) + timedelta(minutes=10)

        if otp_type == "reset":
            user["reset_password_otp"] = otp
            user["reset_password_expires_at"] = otp_exp
            await self._save_user(user)
            await email_service.send_otp_email(email_clean, user.get("name", "Farmer"), otp, purpose="reset")
        else:
            user["verification_otp"] = otp
            user["otp_expires_at"] = otp_exp
            await self._save_user(user)
            await email_service.send_otp_email(email_clean, user.get("name", "Farmer"), otp, purpose="verification")

        return {
            "success": True,
            "message": f"A fresh 6-digit OTP code has been sent to {email_clean}.",
            "email": email_clean,
        }

    async def login(self, req: LoginRequest) -> AuthTokenResponse:
        raw_ident = req.login_identifier.strip().lower()
        handle_ident = raw_ident.lstrip("@")
        email_ident = raw_ident

        user = await self._find_user({
            "$or": [
                {"email": email_ident},
                {"email": handle_ident},
                {"handle": handle_ident},
                {"handle": raw_ident},
            ]
        })

        if not user:
            raise ValueError("Invalid credentials. No account found with this email or handle.")

        if not verify_password(req.password, user.get("hashed_password", "")):
            raise ValueError("Invalid password. Please check your credentials.")

        if not user.get("is_verified", False):
            otp = generate_otp()
            user["verification_otp"] = otp
            user["otp_expires_at"] = datetime.now(timezone.utc) + timedelta(minutes=10)
            await self._save_user(user)
            await email_service.send_otp_email(user["email"], user.get("name", "Farmer"), otp, purpose="verification")
            raise ValueError(f"Account not verified yet. A verification code has been sent to {user['email']}.")

        user_id = str(user.get("_id") or user.get("id"))
        token = create_access_token(user_id, user["email"], user["handle"])

        return AuthTokenResponse(
            access_token=token,
            token_type="bearer",
            user=serialize_user_doc(user),
            message="Logged in successfully.",
        )

    async def forgot_password(self, email: str) -> Dict[str, Any]:
        return await self.resend_otp(email, otp_type="reset")

    async def reset_password(self, req: ResetPasswordRequest) -> Dict[str, Any]:
        email_clean = req.email.strip().lower()
        user = await self._find_user({"email": email_clean})

        if not user:
            raise ValueError("No account found with this email address.")

        stored_otp = user.get("reset_password_otp")
        otp_exp = user.get("reset_password_expires_at")

        if not stored_otp or str(stored_otp).strip() != req.otp.strip():
            raise ValueError("Invalid password reset OTP. Please check the code.")

        if otp_exp:
            now = datetime.now(timezone.utc)
            if otp_exp.tzinfo is None:
                otp_exp = otp_exp.replace(tzinfo=timezone.utc)
            if now > otp_exp:
                raise ValueError("Password reset code has expired. Please request a new code.")

        user["hashed_password"] = hash_password(req.new_password)
        user["reset_password_otp"] = None
        user["reset_password_expires_at"] = None
        user["updated_at"] = datetime.now(timezone.utc)
        await self._save_user(user)

        return {
            "success": True,
            "message": "Password updated successfully. You can now log in with your new password.",
        }

    async def get_user_by_id(self, user_id: str) -> Optional[UserProfileResponse]:
        user = await self._find_user({"_id": user_id})
        if user:
            return serialize_user_doc(user)
        return None

    async def update_profile(self, user_id: str, update: FarmerProfileUpdate) -> UserProfileResponse:
        user = await self._find_user({"_id": user_id})
        if not user:
            raise ValueError("User not found.")

        update_dict = {k: v for k, v in update.model_dump().items() if v is not None}
        if "handle" in update_dict:
            clean_handle = re.sub(r'[^a-zA-Z0-9_]', '', update_dict["handle"].lower().replace('@', ''))
            existing = await self._find_user({"handle": clean_handle})
            if existing and str(existing.get("_id") or existing.get("id")) != str(user_id):
                raise ValueError(f"Handle @{clean_handle} is already in use by another citizen.")
            update_dict["handle"] = clean_handle

        for k, v in update_dict.items():
            user[k] = v
        user["updated_at"] = datetime.now(timezone.utc)
        await self._save_user(user)

        return serialize_user_doc(user)


auth_service = AuthService()
