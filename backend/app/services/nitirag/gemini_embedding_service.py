import logging
import time
from typing import List, Optional, Tuple
import httpx
from app.services.key_rotator import gemini_pool

logger = logging.getLogger("gramsetu.nitirag.embedding")
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] [GeminiEmbeddingEngine] %(message)s")
    ch.setFormatter(formatter)
    logger.addHandler(ch)

# Verified Active Google Gemini Embedding Models (in order of priority)
GEMINI_EMBEDDING_MODELS = [
    "models/gemini-embedding-001",
    "models/text-embedding-004",
    "models/embedding-001",
    "gemini-embedding-001",
]


class GeminiEmbeddingService:
    """
    Google Gemini Vector Embedding Engine for Niti RAG.
    Supports Round-Robin API key rotation across multiple keys and dynamic model fallback.
    """

    def __init__(self):
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self._last_working_model = "models/text-embedding-004"

    def get_pool_status(self) -> dict:
        return {
            "total_keys": gemini_pool.count(),
            "models": GEMINI_EMBEDDING_MODELS,
            "active_model": self._last_working_model,
            "has_keys": gemini_pool.has_keys(),
        }

    async def embed_text(self, text: str) -> Tuple[Optional[List[float]], str]:
        """
        Generates a 768-dimensional vector embedding for a single text chunk.
        Rotates across Gemini API keys and tries model fallbacks if errors occur.
        """
        clean_text = text.strip()
        if not clean_text:
            return None, self._last_working_model

        if not gemini_pool.has_keys():
            logger.warning("No Gemini API keys found in pool.")
            return self._generate_fallback_embedding(clean_text), "fallback-pseudo-vector"

        keys_to_try = gemini_pool.get_all_keys()
        logger.info(f"Generating embedding across {len(keys_to_try)} Gemini keys for text length {len(clean_text)}")

        async with httpx.AsyncClient(timeout=10.0) as client:
            for key_idx, key in enumerate(keys_to_try):
                masked_key = f"{key[:8]}...{key[-4:]}" if len(key) > 12 else "key"
                
                for model_name in GEMINI_EMBEDDING_MODELS:
                    url = f"{self.base_url}/{model_name}:embedContent?key={key}"
                    payload = {
                        "model": model_name,
                        "content": {
                            "parts": [{"text": clean_text[:4000]}]
                        }
                    }

                    try:
                        resp = await client.post(url, json=payload)
                        if resp.status_code == 200:
                            data = resp.json()
                            embedding_values = data.get("embedding", {}).get("values")
                            if embedding_values and isinstance(embedding_values, list):
                                self._last_working_model = model_name
                                logger.info(f"[Gemini] Succeeded with model '{model_name}' on Key #{key_idx + 1} ({masked_key})! Vector dims: {len(embedding_values)}")
                                return embedding_values, model_name
                        elif resp.status_code in [429, 403]:
                            logger.warning(f"[Gemini] Key #{key_idx + 1} ({masked_key}) rate limited ({resp.status_code}). Rotating to next key...")
                            break  # Break out of model loop to try next key
                        else:
                            logger.warning(f"[Gemini] Model '{model_name}' failed with status {resp.status_code}: {resp.text[:120]}. Trying fallback model...")
                            continue
                    except Exception as err:
                        logger.warning(f"[Gemini] Network error with Key #{key_idx + 1}, model '{model_name}': {err}")
                        continue

        logger.error("All Gemini API keys and models exhausted. Using deterministic vector fallback.")
        return self._generate_fallback_embedding(clean_text), "fallback-pseudo-vector"

    async def embed_batch(self, texts: List[str]) -> Tuple[List[List[float]], str]:
        """
        Embeds a list of semantic chunks in parallel/batches.
        """
        if not texts:
            return [], self._last_working_model

        logger.info(f"Embedding batch of {len(texts)} chunks with Gemini...")
        results: List[List[float]] = []
        model_used = self._last_working_model

        # Process in chunks of 5 concurrently
        for i in range(0, len(texts), 5):
            chunk_batch = texts[i : i + 5]
            for text in chunk_batch:
                vec, used = await self.embed_text(text)
                if vec:
                    results.append(vec)
                    model_used = used
                else:
                    results.append(self._generate_fallback_embedding(text))

        return results, model_used

    def _generate_fallback_embedding(self, text: str, dim: int = 768) -> List[float]:
        """
        Deterministic numerical vector fallback to ensure application resilience.
        """
        import hashlib
        import math

        h = hashlib.sha256(text.encode("utf-8")).digest()
        vec = []
        for i in range(dim):
            byte_val = h[i % len(h)]
            # Generate deterministic pseudo-random float between -1.0 and 1.0
            val = math.sin((i + 1) * (byte_val + 1))
            vec.append(round(val, 6))

        # Normalize vector
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [round(x / norm, 6) for x in vec]


gemini_embedding_service = GeminiEmbeddingService()
