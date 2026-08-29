import os
import io
import base64
import logging
from typing import Optional
import httpx
from app.schemas.vanibot import VaniSpeakResponse
from app.services.vanibot.language_service import language_service
from app.services.key_rotator import sarvam_pool

logger = logging.getLogger(__name__)

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


class TextToSpeechService:
    """
    Text-to-Speech synthesis provider adapter for regional Indian languages.
    Primary: Sarvam AI Bulbul v2 with high-fidelity neural voice stream.
    Fallback: Client-side synthesis instructions.
    """

    @classmethod
    async def synthesize_speech(
        cls,
        text: str,
        language: str = "kn",
        speed: float = 1.0,
    ) -> VaniSpeakResponse:
        lang_code = language_service.normalize_language_code(language)
        target_locale = SARVAM_LANG_MAP.get(lang_code, "kn-IN")

        if not text or not text.strip():
            return VaniSpeakResponse(
                language=lang_code,
                audio_base64=None,
                message="Text is empty.",
            )

        clean_text_for_speech = text.replace("#", "").replace("*", "").replace("`", "").replace(">", "").strip()
        if len(clean_text_for_speech) > 450:
            truncated = clean_text_for_speech[:450]
            last_punc = max(truncated.rfind('.'), truncated.rfind('।'), truncated.rfind('?'), truncated.rfind('!'), truncated.rfind('\n'))
            if last_punc > 80:
                clean_text_for_speech = truncated[:last_punc + 1].strip()
            else:
                clean_text_for_speech = truncated.strip()

        sarvam_keys = sarvam_pool.get_all_keys()
        if sarvam_keys:
            for key_idx, key in enumerate(sarvam_keys):
                try:
                    headers = {
                        "api-subscription-key": key,
                        "Content-Type": "application/json",
                    }
                    payload = {
                        "inputs": [clean_text_for_speech],
                        "target_language_code": target_locale,
                        "speaker": "kavya",
                        "model": "bulbul:v3",
                    }
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.post(
                            "https://api.sarvam.ai/text-to-speech",
                            headers=headers,
                            json=payload,
                        )
                        if resp.status_code == 200:
                            audios = resp.json().get("audios", [])
                            if audios and len(audios[0]) > 100:
                                logger.info(f"[Sarvam TTS] Key #{key_idx + 1} generated voice audio in {target_locale}.")
                                return VaniSpeakResponse(
                                    language=lang_code,
                                    audio_base64=audios[0],
                                    mime_type="audio/wav",
                                    provider="sarvam",
                                    message="Synthesized via Sarvam AI Bulbul v3 Neural Voice",
                                )
                except Exception as e:
                    logger.warning(f"[Sarvam TTS] Key #{key_idx + 1} failed: {e}. Trying next...")
                    continue

        return VaniSpeakResponse(
            language=lang_code,
            audio_base64=None,
            mime_type="audio/mp3",
            provider="client_fallback",
            message="Client-side SpeechSynthesis ready.",
        )


text_to_speech_service = TextToSpeechService()
