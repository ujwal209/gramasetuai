import os
import io
import base64
import logging
from typing import Dict, Any, Optional
import httpx
from app.schemas.vani import VaniTranscriptionResponse
from app.services.vani.language_service import language_service
from app.services.key_rotator import sarvam_pool, groq_pool

logger = logging.getLogger(__name__)

# Map common language codes to Sarvam locale formats
SARVAM_LANG_MAP = {
    "kn": "kn-IN",
    "hi": "hi-IN",
    "en": "en-IN",
    "te": "te-IN",
    "ta": "ta-IN",
    "mr": "mr-IN",
    "bn": "bn-IN",
    "gu": "gu-IN",
}


class VaniSTTService:
    """
    Speech-to-Text provider adapter for regional Indian languages.
    Primary: Sarvam AI Saarika v2.5 across rotated API keys.
    Secondary Fallback: Groq Whisper Large v3.
    """

    @classmethod
    async def transcribe_audio(
        cls,
        audio_bytes: bytes,
        language: str = "kn",
        mime_type: str = "audio/webm",
    ) -> VaniTranscriptionResponse:
        """
        Transcribes uploaded audio bytes into localized text.
        """
        lang_code = language_service.normalize_language_code(language)
        target_locale = SARVAM_LANG_MAP.get(lang_code, "kn-IN")

        if not audio_bytes or len(audio_bytes) < 100:
            return VaniTranscriptionResponse(
                transcribed_text="",
                detected_language=lang_code,
                confidence=0.0,
            )

        # 1. SARVAM AI STT (Saarika v2.5) with Key Rotation
        sarvam_keys = sarvam_pool.get_all_keys()
        if sarvam_keys:
            for key_idx, key in enumerate(sarvam_keys):
                try:
                    headers = {"api-subscription-key": key}
                    files = {"file": ("speech.wav", audio_bytes, mime_type)}
                    data = {"model": "saarika:v2.5", "language_code": target_locale}
                    async with httpx.AsyncClient(timeout=12.0) as client:
                        resp = await client.post(
                            "https://api.sarvam.ai/speech-to-text",
                            headers=headers,
                            files=files,
                            data=data,
                        )
                        if resp.status_code == 200:
                            transcript = resp.json().get("transcript", "").strip()
                            if transcript:
                                logger.info(f"[Sarvam STT] Key #{key_idx + 1} transcribed audio: '{transcript[:60]}...'")
                                return VaniTranscriptionResponse(
                                    transcribed_text=transcript,
                                    detected_language=lang_code,
                                    confidence=0.98,
                                )
                except Exception as e:
                    logger.warning(f"[Sarvam STT] Key #{key_idx + 1} failed: {e}. Trying next...")
                    continue

        # 2. GROQ WHISPER ASR (whisper-large-v3) with Key Rotation
        groq_keys = groq_pool.get_all_keys()
        if groq_keys:
            for key_idx, key in enumerate(groq_keys):
                try:
                    from groq import Groq
                    groq_client = Groq(api_key=key)
                    # Use Groq Audio API
                    audio_file = io.BytesIO(audio_bytes)
                    audio_file.name = "speech.webm"
                    transcription = groq_client.audio.transcriptions.create(
                        file=(audio_file.name, audio_file.getvalue(), mime_type),
                        model="whisper-large-v3",
                        language=lang_code if lang_code in ["en", "hi", "kn", "mr", "ta", "te"] else None,
                        temperature=0.0,
                    )
                    text = transcription.text.strip() if transcription else ""
                    if text:
                        logger.info(f"[Groq Whisper STT] Transcribed text: '{text[:60]}...'")
                        return VaniTranscriptionResponse(
                            transcribed_text=text,
                            detected_language=lang_code,
                            confidence=0.95,
                        )
                except Exception as groq_err:
                    logger.warning(f"[Groq STT] Key #{key_idx + 1} failed: {groq_err}. Trying fallback...")
                    continue

        # 3. Fallback text if silence / unrecognized
        return VaniTranscriptionResponse(
            transcribed_text="",
            detected_language=lang_code,
            confidence=0.0,
        )


stt_service = VaniSTTService()
