import io
import re
import os
import json
import base64
import logging
from typing import Dict, Any, Optional, Tuple, List
from PIL import Image, ImageStat, ImageFilter
from pypdf import PdfReader
import httpx

from app.services.key_rotator import groq_pool, gemini_pool

logger = logging.getLogger(__name__)


class OCRService:
    """
    High-Performance Multimodal statutory document extraction engine.
    - Images: Groq Vision (Llama 3.2 11B/90B) with Gemini Vision fallback.
    - Documents & PDFs: High-speed PyPDF extraction -> Groq Vision page image OCR -> Fast Gemini fallback.
    """

    @staticmethod
    def assess_image_quality(image_bytes: bytes) -> Tuple[bool, float, Dict[str, Any]]:
        """
        Assess image quality: resolution, brightness, contrast, and edge sharpness.
        Returns: (is_readable, quality_score_0_100, metrics)
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            width, height = image.size
            
            gray = image.convert("L")
            stat = ImageStat.Stat(gray)
            
            mean_brightness = stat.mean[0]
            stddev_contrast = stat.stddev[0]
            
            edges = gray.filter(ImageFilter.FIND_EDGES)
            edge_stat = ImageStat.Stat(edges)
            sharpness_val = edge_stat.var[0] if edge_stat.var else 0.0
            
            score = 100.0
            if width < 300 or height < 300:
                score -= 30.0
            elif width < 600 or height < 600:
                score -= 15.0
                
            if mean_brightness < 40 or mean_brightness > 230:
                score -= 25.0
            elif mean_brightness < 70 or mean_brightness > 200:
                score -= 10.0
                
            if stddev_contrast < 15:
                score -= 35.0
            elif stddev_contrast < 30:
                score -= 15.0
                
            if sharpness_val < 5:
                score -= 25.0
                
            score = max(5.0, min(100.0, score))
            is_readable = score >= 30.0
            
            metrics = {
                "width": width,
                "height": height,
                "format": image.format or "UNKNOWN",
                "mean_brightness": round(mean_brightness, 1),
                "contrast_stddev": round(stddev_contrast, 1),
                "edge_sharpness": round(sharpness_val, 1),
            }
            return is_readable, round(score, 1), metrics
        except Exception as e:
            logger.warning(f"Image quality assessment error: {e}")
            return True, 75.0, {"error": str(e)}

    @classmethod
    def extract_text_and_images_from_pdf(cls, file_bytes: bytes) -> Tuple[str, List[bytes]]:
        """
        Fast local extraction of text and embedded page images from PDF using PyPDF.
        Runs in <15ms without network calls.
        """
        extracted_text = []
        extracted_images: List[bytes] = []
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            for idx, page in enumerate(reader.pages):
                # 1. Text extraction
                page_text = page.extract_text()
                if page_text:
                    extracted_text.append(page_text)
                
                # 2. Image extraction for scanned PDFs
                if idx < 3 and hasattr(page, "images"):
                    try:
                        for img in page.images:
                            if hasattr(img, "data") and img.data:
                                extracted_images.append(img.data)
                    except Exception:
                        pass
        except Exception as e:
            logger.warning(f"PyPDF fast extraction notice: {e}")

        return "\n".join(extracted_text).strip(), extracted_images

    @classmethod
    def extract_document_data(
        cls,
        file_bytes: bytes,
        file_name: str,
        mime_type: str,
    ) -> Dict[str, Any]:
        """
        Extracts text and structured field proposals from file content.
        - Images -> Groq Vision (Llama 3.2 11B/90B) -> Gemini Vision fallback.
        - PDFs -> Fast PyPDF -> Groq Vision on extracted page images -> Fast Gemini Document API fallback.
        """
        raw_text = ""
        is_readable = True
        quality_score = 100.0
        metrics: Dict[str, Any] = {}
        detected_ocr_engine = "heuristic"

        is_pdf = "pdf" in mime_type.lower() or file_name.lower().endswith(".pdf")
        is_image = mime_type.startswith("image/") or any(file_name.lower().endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp"])

        if is_pdf:
            # 1. FAST LOCAL PyPDF EXTRACTION (<10ms)
            pypdf_text, embedded_images = cls.extract_text_and_images_from_pdf(file_bytes)
            
            if pypdf_text and len(pypdf_text.strip()) >= 40:
                raw_text = pypdf_text
                detected_ocr_engine = "pypdf_native"
                quality_score = 95.0
            elif embedded_images:
                # 2. SCANNED PDF -> Send extracted page image to Groq Vision (Fast sub-1s OCR)
                logger.info(f"PDF {file_name} has no text layer; running Groq Vision on embedded scan ({len(embedded_images)} images)...")
                groq_scan_text, engine = cls._extract_image_groq_vision(embedded_images[0], file_name, "image/jpeg")
                if groq_scan_text:
                    raw_text = groq_scan_text
                    detected_ocr_engine = f"pdf_groq_vision_{engine}"
                    quality_score = 88.0

            # 3. IF STILL EMPTY -> Fast Gemini Document Multimodal (with strict 8s timeout)
            if not raw_text or len(raw_text.strip()) < 20:
                gemini_text = cls._extract_pdf_gemini(file_bytes, file_name)
                if gemini_text:
                    raw_text = gemini_text
                    detected_ocr_engine = "gemini_multimodal_pdf"
                    quality_score = 90.0

            metrics = {"type": "pdf", "extracted_chars": len(raw_text)}

        elif is_image:
            is_readable, quality_score, metrics = cls.assess_image_quality(file_bytes)
            
            # 1. Primary: Groq Vision (Llama 3.2 Vision)
            raw_text, detected_ocr_engine = cls._extract_image_groq_vision(file_bytes, file_name, mime_type)
            
            # 2. Secondary fallback: Gemini Vision if Groq returned empty
            if not raw_text or len(raw_text.strip()) < 10:
                gemini_text = cls._extract_image_gemini_vision(file_bytes, file_name, mime_type)
                if gemini_text:
                    raw_text = gemini_text
                    detected_ocr_engine = "gemini_vision_fallback"

        else:
            try:
                decoded = file_bytes.decode("utf-8", errors="ignore").strip()
                if decoded:
                    raw_text = decoded
                    detected_ocr_engine = "utf8_text"
            except Exception:
                pass

        if not raw_text:
            raw_text = file_name.replace("_", " ").replace("-", " ")

        detected_type, confidence = cls.detect_document_type(raw_text, file_name)
        extracted_fields = cls.parse_fields_by_type(raw_text, detected_type)

        logger.info(f"OCR completed for '{file_name}': Engine={detected_ocr_engine}, Type={detected_type} (conf={confidence:.2f}), Chars={len(raw_text)}")

        return {
            "raw_text": raw_text,
            "detected_type": detected_type,
            "confidence": confidence,
            "is_readable": is_readable,
            "quality_score": quality_score,
            "metrics": metrics,
            "extracted_fields": extracted_fields,
            "ocr_engine": detected_ocr_engine,
        }

    # =========================================================================
    # GROQ VISION OCR ENGINE (PRIMARY FOR IMAGES & SCANNED PDF PAGES)
    # =========================================================================
    @staticmethod
    def _extract_image_groq_vision(image_bytes: bytes, file_name: str, mime_type: str = "image/jpeg") -> Tuple[str, str]:
        """
        Extracts verbatim text and statutory fields from images using Groq Vision (llama-3.2-11b-vision-preview / llama-3.2-90b-vision-preview).
        Rotates across active Groq API keys with strict timeouts.
        """
        if not groq_pool.has_keys():
            return "", "none"

        normalized_mime = "image/jpeg"
        if "png" in mime_type.lower() or file_name.lower().endswith(".png"):
            normalized_mime = "image/png"
        elif "webp" in mime_type.lower() or file_name.lower().endswith(".webp"):
            normalized_mime = "image/webp"

        b64_img = base64.b64encode(image_bytes).decode("utf-8")
        data_uri = f"data:{normalized_mime};base64,{b64_img}"

        # Focus on the fast 11B vision model first
        vision_models = ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"]

        for _ in range(min(groq_pool.count(), 3)):
            groq_key = groq_pool.get_next_key()
            if not groq_key:
                break

            for model_name in vision_models:
                try:
                    with httpx.Client(timeout=httpx.Timeout(8.0, connect=3.0)) as client:
                        response = client.post(
                            "https://api.groq.com/openai/v1/chat/completions",
                            headers={
                                "Authorization": f"Bearer {groq_key}",
                                "Content-Type": "application/json",
                            },
                            json={
                                "model": model_name,
                                "messages": [
                                    {
                                        "role": "user",
                                        "content": [
                                            {
                                                "type": "text",
                                                "text": (
                                                    "You are an expert Indian Government statutory document OCR engine. "
                                                    "Transcribe all readable text, table cells, revenue numbers, personal names, Aadhaar/ID numbers, "
                                                    "land survey numbers/extents, and bank details from this image accurately and verbatim."
                                                ),
                                            },
                                            {
                                                "type": "image_url",
                                                "image_url": {
                                                    "url": data_uri,
                                                },
                                            },
                                        ],
                                    }
                                ],
                                "temperature": 0.1,
                                "max_tokens": 1024,
                            },
                        )

                        if response.status_code == 200:
                            data = response.json()
                            extracted = data["choices"][0]["message"]["content"].strip()
                            if extracted:
                                return extracted, model_name
                except Exception as e:
                    logger.warning(f"Groq Vision {model_name} attempt note: {e}")
                    continue

        return "", "failed"

    # =========================================================================
    # GEMINI MULTIMODAL API (FALLBACK WITH STRICT 6s TIMEOUT)
    # =========================================================================
    @staticmethod
    def _extract_image_gemini_vision(image_bytes: bytes, file_name: str, mime_type: str = "image/jpeg") -> str:
        """
        Multimodal Image OCR using Gemini (gemini-1.5-flash / gemini-2.5-flash).
        """
        if not gemini_pool.has_keys():
            return ""

        b64_img = base64.b64encode(image_bytes).decode("utf-8")
        normalized_mime = "image/jpeg"
        if "png" in mime_type.lower() or file_name.lower().endswith(".png"):
            normalized_mime = "image/png"
        elif "webp" in mime_type.lower() or file_name.lower().endswith(".webp"):
            normalized_mime = "image/webp"

        models = ["gemini-1.5-flash", "gemini-2.5-flash"]

        for _ in range(min(gemini_pool.count(), 2)):
            gemini_key = gemini_pool.get_next_key()
            if not gemini_key:
                break

            for model in models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
                    payload = {
                        "contents": [{
                            "parts": [
                                {"text": "Extract all readable text, identification numbers, names, and revenue/bank fields verbatim from this document image."},
                                {"inline_data": {"mime_type": normalized_mime, "data": b64_img}}
                            ]
                        }],
                        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 800}
                    }
                    with httpx.Client(timeout=httpx.Timeout(6.0, connect=2.5)) as client:
                        res = client.post(url, json=payload)
                        if res.status_code == 200:
                            data = res.json()
                            candidates = data.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                if parts:
                                    text = parts[0].get("text", "").strip()
                                    if text:
                                        return text
                except Exception as e:
                    logger.warning(f"Gemini Vision {model} error: {e}")
                    continue

        return ""

    @staticmethod
    def _extract_pdf_gemini(pdf_bytes: bytes, file_name: str) -> str:
        """
        Extracts text from PDFs using Gemini Multimodal API with strict fast timeout.
        """
        if not gemini_pool.has_keys():
            return ""

        # Limit PDF payload size to prevent huge base64 payload timeouts
        if len(pdf_bytes) > 4 * 1024 * 1024:
            logger.info(f"PDF {file_name} is large ({len(pdf_bytes)} bytes); skipping heavy REST payload")
            return ""

        b64_pdf = base64.b64encode(pdf_bytes).decode("utf-8")
        models = ["gemini-1.5-flash", "gemini-2.5-flash"]

        for _ in range(min(gemini_pool.count(), 2)):
            gemini_key = gemini_pool.get_next_key()
            if not gemini_key:
                break

            for model in models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
                    payload = {
                        "contents": [{
                            "parts": [
                                {"text": "Extract all readable text, tables, revenue records, names, numbers, and clauses verbatim from this Indian government document PDF."},
                                {"inline_data": {"mime_type": "application/pdf", "data": b64_pdf}}
                            ]
                        }],
                        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1024}
                    }
                    with httpx.Client(timeout=httpx.Timeout(6.0, connect=2.5)) as client:
                        res = client.post(url, json=payload)
                        if res.status_code == 200:
                            data = res.json()
                            candidates = data.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                if parts:
                                    text = parts[0].get("text", "").strip()
                                    if text:
                                        return text
                except Exception as e:
                    logger.warning(f"Gemini PDF extraction {model} notice: {e}")
                    continue

        return ""

    # =========================================================================
    # DETERMINISTIC CLASSIFICATION & PARSING
    # =========================================================================
    @classmethod
    def detect_document_type(cls, text: str, file_name: str) -> Tuple[str, float]:
        """
        Deterministic classification of Indian identity, welfare, and property document types.
        """
        combined = f"{file_name} {text}".lower()

        # Aadhaar patterns
        if any(k in combined for k in ["aadhaar", "uidai", "unique identification", "mera aadhaar", "meraaadhaar", "vid", "enrolment no"]):
            return "aadhaar", 0.95
        if re.search(r"\b\d{4}\s\d{4}\s\d{4}\b", text):
            return "aadhaar", 0.90

        # Land Record patterns (ROR / Khasra / Khatauni / RTC / Pahani / Patta)
        if any(k in combined for k in ["ror", "khasra", "khatauni", "land record", "rtc", "pahani", "patta", "bhoomi", "khatiyan", "survey no", "hissa"]):
            return "land_record", 0.92

        # Bank Passbook / Account proof
        if any(k in combined for k in ["passbook", "bank account", "bank statement", "ifsc", "account no", "sbi", "canara", "punjab national", "hdfc", "icici", "bank of baroda", "union bank", "prathama bank", "gramin bank"]):
            return "bank_passbook", 0.93

        # Ration Card / BPL / SECC
        if any(k in combined for k in ["ration card", "ration", "bpl card", "nfsa", "antyodaya", "secc", "phh", "rashan"]):
            return "ration_card", 0.91

        # Income Certificate
        if any(k in combined for k in ["income certificate", "aaya pramana", "aamdani", "annual income"]):
            return "income_certificate", 0.89

        # Caste Certificate
        if any(k in combined for k in ["caste certificate", "community certificate", "sc/st", "obc certificate", "jaati praman"]):
            return "caste_certificate", 0.89

        # MGNREGA Job Card
        if any(k in combined for k in ["mgnrega", "nrega", "job card", "employment guarantee", "rozgar card"]):
            return "mgnrega_card", 0.90

        # MCP Card (Mother & Child Protection)
        if any(k in combined for k in ["mcp card", "mother and child", "mamta card", "rch id", "thayi card"]):
            return "mcp_card", 0.90

        # Voter ID / EPIC
        if any(k in combined for k in ["election commission", "voter id", "epic", "elector photo identity"]):
            return "voter_id", 0.92

        # PAN Card
        if any(k in combined for k in ["income tax department", "permanent account number", "pan card"]) or re.search(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", text):
            return "pan_card", 0.94

        return "general_document", 0.50

    @classmethod
    def parse_fields_by_type(cls, text: str, doc_type: str) -> Dict[str, Any]:
        """
        Deterministic regex and structural parser for extracting key document fields.
        """
        fields: Dict[str, Any] = {}

        # 1. Common Name extraction patterns
        name_match = re.search(
            r"(?:Name|Applicant Name|Holder Name|नाम|Pattedar|Farmer Name)\s*[:\-]?\s*([A-Za-z \.]{3,40})",
            text,
            re.IGNORECASE,
        )
        if name_match:
            fields["holder_name"] = name_match.group(1).strip()

        # 2. Date of Birth / Age patterns
        dob_match = re.search(
            r"(?:DOB|Date of Birth|जन्म तिथि|Year of Birth|जन्म वर्ष)\s*[:\-\s]?\s*(\d{2}/\d{2}/\d{4}|\d{2}-\d{2}-\d{4}|\d{4})",
            text,
            re.IGNORECASE,
        )
        if dob_match:
            fields["dob"] = dob_match.group(1).strip()

        # 3. Gender
        gender_match = re.search(r"\b(Male|Female|Transgender|पुरुष|महिला)\b", text, re.IGNORECASE)
        if gender_match:
            fields["gender"] = gender_match.group(1).capitalize()

        # 4. State / District
        state_match = re.search(
            r"\b(Karnataka|Uttar Pradesh|Maharashtra|Bihar|Madhya Pradesh|Rajasthan|Tamil Nadu|Andhra Pradesh|Telangana|Gujarat|West Bengal|Punjab|Haryana|Odisha|Kerala|Assam|Jharkhand)\b",
            text,
            re.IGNORECASE,
        )
        if state_match:
            fields["state"] = state_match.group(1)

        # Document-specific field extraction
        if doc_type == "aadhaar":
            uid_match = re.search(r"\b(\d{4})\s?(\d{4})\s?(\d{4})\b", text)
            if uid_match:
                raw_uid = f"{uid_match.group(1)}{uid_match.group(2)}{uid_match.group(3)}"
                fields["aadhaar_number"] = raw_uid
                fields["id_number_masked"] = f"XXXX-XXXX-{uid_match.group(3)}"
            else:
                fields["id_number_masked"] = None

        elif doc_type == "land_record":
            survey_match = re.search(
                r"(?:Survey|Sy\.?|Khasra|Khata|Gat|ROR)\s*(?:No\.?|Number)?\s*[:\-\s]?\s*([A-Za-z0-9\-/]+)",
                text,
                re.IGNORECASE,
            )
            if survey_match:
                fields["survey_number"] = survey_match.group(1).strip()

            extent_match = re.search(
                r"(?:Area|Extent|Total Area|क्षेत्रफल)\s*[:\-\s]?\s*([\d\.]+)\s*(Acres?|Guntas?|Hectares?|Bigha)?",
                text,
                re.IGNORECASE,
            )
            if extent_match:
                try:
                    val = float(extent_match.group(1))
                    unit = (extent_match.group(2) or "Acres").lower()
                    if "gunta" in unit:
                        acres = round(val / 40.0, 2)
                    elif "hectare" in unit:
                        acres = round(val * 2.47105, 2)
                    else:
                        acres = round(val, 2)
                    fields["land_area_acres"] = acres
                    fields["raw_extent_str"] = f"{val} {unit}"
                except ValueError:
                    pass

        elif doc_type == "bank_passbook":
            ifsc_match = re.search(r"\b([A-Z]{4}0[A-Z0-9]{6})\b", text.upper())
            if ifsc_match:
                fields["ifsc_code"] = ifsc_match.group(1)

            ac_match = re.search(r"(?:A/C|Account|Acc|Khata)\s*(?:No\.?|Number)?\s*[:\-\s]?\s*(\d{9,18})", text, re.IGNORECASE)
            if ac_match:
                raw_ac = ac_match.group(1)
                fields["account_number"] = raw_ac
                fields["account_masked"] = f"XXXXXX{raw_ac[-4:]}" if len(raw_ac) >= 4 else "XXXXXX"

            bank_names = [
                "State Bank of India", "SBI", "Canara Bank", "Punjab National Bank", "PNB",
                "HDFC Bank", "ICICI Bank", "Bank of Baroda", "Union Bank of India",
                "Karnataka Gramin Bank", "Prathama Bank", "Aryavart Bank", "Baroda UP Bank"
            ]
            for b in bank_names:
                if b.lower() in text.lower():
                    fields["bank_name"] = b
                    break

        elif doc_type == "ration_card":
            rc_match = re.search(r"(?:Card|RC|Ration|NFSA)\s*(?:No\.?|Number|ID)?\s*[:\-\s]?\s*([A-Z0-9\-/]{8,20})", text, re.IGNORECASE)
            if rc_match:
                fields["ration_card_number"] = rc_match.group(1)

            if re.search(r"\b(BPL|Antyodaya|AAY|Priority Household|PHH|Below Poverty Line)\b", text, re.IGNORECASE):
                fields["card_category"] = "BPL"
            elif re.search(r"\b(APL|Above Poverty Line|Non-Priority)\b", text, re.IGNORECASE):
                fields["card_category"] = "APL"

        elif doc_type == "income_certificate":
            inc_match = re.search(r"(?:Income|Annual Income|वार्षिक आय)\s*[:\-\s₹Rs\.]*([\d,]+)", text, re.IGNORECASE)
            if inc_match:
                try:
                    num_str = inc_match.group(1).replace(",", "")
                    fields["annual_income"] = float(num_str)
                except ValueError:
                    pass

            exp_match = re.search(r"(?:Valid Upto|Expiry Date|Valid Till|समाप्ति तिथि)\s*[:\-\s]?\s*(\d{2}/\d{2}/\d{4}|\d{2}-\d{2}-\d{4})", text, re.IGNORECASE)
            if exp_match:
                fields["expiry_date"] = exp_match.group(1)

        elif doc_type == "mgnrega_card":
            job_match = re.search(r"(?:Job Card|MGNREGA|NREGA)\s*(?:No\.?|ID)?\s*[:\-\s]?\s*([A-Z0-9\-/]+)", text, re.IGNORECASE)
            if job_match:
                fields["job_card_number"] = job_match.group(1)

        elif doc_type == "pan_card":
            pan_match = re.search(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b", text)
            if pan_match:
                raw_pan = pan_match.group(1)
                fields["pan_number"] = raw_pan
                fields["id_number_masked"] = f"XXXXX{raw_pan[5:9]}{raw_pan[9]}"

        elif doc_type == "voter_id":
            epic_match = re.search(r"\b([A-Z]{3}[0-9]{7})\b", text)
            if epic_match:
                fields["epic_number"] = epic_match.group(1)
                fields["id_number_masked"] = f"XXX{epic_match.group(1)[-4:]}"

        return fields


ocr_service = OCRService()
