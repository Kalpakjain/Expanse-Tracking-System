import json
import logging

try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover - covered by environments without optional AI dependency
    genai = None

from app.core.config import settings

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """
You are extracting structured data from a receipt image. Respond with ONLY a
JSON object, no other text, no markdown formatting, in exactly this shape:
{
  "merchant_name": string or null,
  "amount": number or null,
  "date": "YYYY-MM-DD" string or null,
  "category_guess": one of ["Food", "Travel", "Bills", "Shopping", "Health", "Other"],
  "confidence": number between 0 and 1
}
If you cannot read a field clearly, use null for it and lower the confidence
score accordingly. Do not guess wildly - only fill in fields you can actually
read from the image.
"""


def extract_receipt_data(file_bytes: bytes, content_type: str) -> dict | None:
    if not settings.gemini_api_key or not settings.receipt_extraction_enabled:
        return None
    if genai is None:
        logger.warning("Gemini receipt extraction dependency is not installed, falling back to heuristic")
        return None
    try:
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(settings.gemini_model)
        response = model.generate_content([
            EXTRACTION_PROMPT,
            {"mime_type": content_type, "data": file_bytes},
        ])
        raw_text = response.text.strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.strip("`").removeprefix("json").strip()
        return json.loads(raw_text)
    except Exception:
        logger.exception("Gemini receipt extraction failed, falling back to heuristic")
        return None
