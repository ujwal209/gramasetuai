import io
import re
import logging
from typing import List, Dict, Any, Tuple
import pypdf

logger = logging.getLogger("gramsetu.nitirag.pdf")
logger.setLevel(logging.INFO)


class PdfProcessorService:
    """
    High-accuracy PDF Gazette parser and semantic chunking engine.
    Extracts page-by-page text, cleans gazette artifacts, and creates overlapping semantic windows.
    """

    def extract_and_chunk_pdf(
        self,
        pdf_bytes: bytes,
        chunk_size: int = 700,
        chunk_overlap: int = 120,
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Parses a PDF into semantic overlapping chunks with page metadata.
        Returns:
            (chunks_list, document_metadata)
        """
        logger.info(f"Parsing PDF document of size: {len(pdf_bytes)} bytes")
        stream = io.BytesIO(pdf_bytes)
        reader = pypdf.PdfReader(stream)

        total_pages = len(reader.pages)
        full_extracted_pages: List[Dict[str, Any]] = []
        doc_title_candidate = None

        for page_idx, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text() or ""
                # Clean whitespace and page artifacts
                cleaned_text = self._clean_gazette_text(page_text)
                if cleaned_text:
                    full_extracted_pages.append({
                        "page_number": page_idx + 1,
                        "text": cleaned_text,
                    })
                    if not doc_title_candidate and len(cleaned_text) > 20:
                        doc_title_candidate = self._extract_title_from_text(cleaned_text)
            except Exception as page_err:
                logger.warning(f"Error extracting page {page_idx + 1}: {page_err}")

        # If no text could be extracted directly (e.g. empty or scanned)
        if not full_extracted_pages:
            logger.warning("No selectable text extracted from PDF. Creating placeholder chunk.")
            full_extracted_pages.append({
                "page_number": 1,
                "text": "Official Government Gazette & Notification. Scanned statutory document.",
            })

        # Generate semantic overlapping chunks
        chunks: List[Dict[str, Any]] = []
        global_chunk_idx = 0

        for p in full_extracted_pages:
            page_num = p["page_number"]
            page_text = p["text"]

            page_chunks = self._split_text_into_chunks(page_text, chunk_size, chunk_overlap)
            for c_text in page_chunks:
                if len(c_text.strip()) > 30:
                    chunks.append({
                        "chunk_index": global_chunk_idx,
                        "page_number": page_num,
                        "text": c_text.strip(),
                        "char_count": len(c_text.strip()),
                    })
                    global_chunk_idx += 1

        metadata = {
            "total_pages": total_pages,
            "total_chunks": len(chunks),
            "file_size_bytes": len(pdf_bytes),
            "detected_title": doc_title_candidate or "Official Gazette Notification",
        }

        logger.info(f"PDF extraction complete: {total_pages} pages, {len(chunks)} semantic chunks generated.")
        return chunks, metadata

    def _clean_gazette_text(self, text: str) -> str:
        # Remove repeated newlines and clean whitespace
        text = re.sub(r'\r\n', '\n', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]{2,}', ' ', text)
        return text.strip()

    def _split_text_into_chunks(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """
        Splits text into overlapping chunks, respecting sentence/paragraph boundaries when possible.
        """
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        chunks: List[str] = []
        current_chunk = ""

        for p in paragraphs:
            if len(current_chunk) + len(p) + 2 <= chunk_size:
                current_chunk = f"{current_chunk}\n\n{p}" if current_chunk else p
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                    # Create overlap from end of current chunk
                    overlap_text = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
                    current_chunk = f"{overlap_text}\n\n{p}"
                else:
                    # Paragraph is longer than chunk_size, split by character window
                    for i in range(0, len(p), chunk_size - overlap):
                        sub_chunk = p[i : i + chunk_size]
                        if sub_chunk:
                            chunks.append(sub_chunk)
                    current_chunk = ""

        if current_chunk:
            chunks.append(current_chunk)

        return chunks

    def _extract_title_from_text(self, text: str) -> str:
        lines = [line.strip() for line in text.split("\n") if len(line.strip()) > 10]
        if lines:
            return lines[0][:120]
        return "Official Government Circular"


pdf_processor = PdfProcessorService()
