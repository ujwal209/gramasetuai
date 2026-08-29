import os
import re
import logging
from typing import List, Optional, Tuple
from pathlib import Path
import threading

logger = logging.getLogger(__name__)


def extract_all_keys_from_env_file() -> Tuple[List[str], List[str], List[str], List[str]]:
    """
    Directly extracts all Groq, Tavily, Sarvam, and Gemini API keys from .env file.
    """
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    groq_keys = []
    tavily_keys = []
    sarvam_keys = []
    gemini_keys = []

    if env_path.exists():
        try:
            content = env_path.read_text(encoding="utf-8")
            groq_keys = list(dict.fromkeys(re.findall(r'gsk_[a-zA-Z0-9]+', content)))
            tavily_keys = list(dict.fromkeys(re.findall(r'tvly-[a-zA-Z0-9\-_]+', content)))
            sarvam_keys = list(dict.fromkeys(re.findall(r'sk_[a-z0-9]{8}_[a-zA-Z0-9]+', content)))
            
            # Gemini keys (AIzaSy... and AQ...)
            aiza_keys = re.findall(r'AIzaSy[a-zA-Z0-9_\-]+', content)
            aq_keys = re.findall(r'AQ\.[a-zA-Z0-9_\-]+', content)
            gemini_keys = list(dict.fromkeys(aiza_keys + aq_keys))
        except Exception as e:
            logger.error(f"Error reading .env file: {e}")

    # Fallbacks to os.environ
    if not groq_keys:
        raw = os.environ.get("GROQ_API_KEYS", "") or os.environ.get("GROQ_API_KEY", "")
        groq_keys = list(dict.fromkeys(re.findall(r'gsk_[a-zA-Z0-9]+', raw)))
    if not tavily_keys:
        raw = os.environ.get("TAVILY_API_KEYS", "") or os.environ.get("TAVILY_API_KEY", "")
        tavily_keys = list(dict.fromkeys(re.findall(r'tvly-[a-zA-Z0-9\-_]+', raw)))
    if not sarvam_keys:
        raw = os.environ.get("SARVAM_API_KEYS", "") or os.environ.get("SARVAM_API_KEY", "")
        sarvam_keys = list(dict.fromkeys(re.findall(r'sk_[a-z0-9]{8}_[a-zA-Z0-9]+', raw)))
    if not gemini_keys:
        raw = os.environ.get("GEMINI_API_KEYS", "") or os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GOOGLE_API_KEY", "")
        gemini_keys = list(dict.fromkeys(re.findall(r'AIzaSy[a-zA-Z0-9_\-]+', raw) + re.findall(r'AQ\.[a-zA-Z0-9_\-]+', raw)))

    return groq_keys, tavily_keys, sarvam_keys, gemini_keys


class RoundRobinKeyPool:
    """
    Thread-safe Round-Robin API Key Pool with automatic rotation and fallback.
    """

    def __init__(self, name: str, keys: List[str]):
        self.name = name
        self.keys = keys
        self._index = 0
        self._lock = threading.Lock()
        logger.info(f"Initialized {name} Key Pool with {len(keys)} active keys.")

    def has_keys(self) -> bool:
        return len(self.keys) > 0

    def get_next_key(self) -> Optional[str]:
        if not self.keys:
            return None
        with self._lock:
            key = self.keys[self._index % len(self.keys)]
            self._index = (self._index + 1) % len(self.keys)
            return key

    def get_all_keys(self) -> List[str]:
        return list(self.keys)

    def count(self) -> int:
        return len(self.keys)


groq_keys, tavily_keys, sarvam_keys, gemini_keys = extract_all_keys_from_env_file()

tavily_pool = RoundRobinKeyPool("Tavily", tavily_keys)
groq_pool = RoundRobinKeyPool("Groq", groq_keys)
sarvam_pool = RoundRobinKeyPool("Sarvam", sarvam_keys)
gemini_pool = RoundRobinKeyPool("Gemini", gemini_keys)
