"""Text normalisation shared by training and inference.

Entity surface forms (handles, phone numbers, amounts, links) are replaced by
placeholder tokens so the classifier learns the *shape* of a request rather
than memorising specific identifiers. Lives in its own module so the pickled
pipeline can import it at inference time.
"""

import re

_UPI = re.compile(r"[a-z0-9][a-z0-9._-]{1,63}@[a-z][a-z0-9]{1,31}")
_URL = re.compile(r"(?:https?://|www\.)\S+|\b[a-z0-9-]+\.(?:in|com|net|org|xyz|link|app|ly|co)\b\S*")
_PHONE = re.compile(r"(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}")
_AMOUNT_PREFIX = re.compile(r"(?:₹|rs\.?|inr)\s*\d[\d,]*(?:\.\d+)?\s*(?:k|lakh|lac)?")
_AMOUNT_SUFFIX = re.compile(r"\d[\d,]*(?:\.\d+)?\s*(?:/-|rupees?|rs\b|k\b|lakh|lac)")
_DIGITS = re.compile(r"\d+")


def normalise_text(text: str) -> str:
    text = str(text).lower()
    text = _UPI.sub(" upihandle ", text)
    text = _URL.sub(" weblink ", text)
    text = _PHONE.sub(" phonenum ", text)
    text = _AMOUNT_PREFIX.sub(" rupeeamount ", text)
    text = _AMOUNT_SUFFIX.sub(" rupeeamount ", text)
    text = _DIGITS.sub(" num ", text)
    return text
