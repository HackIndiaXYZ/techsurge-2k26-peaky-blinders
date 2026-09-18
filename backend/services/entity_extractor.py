"""Rule-based extraction of payment entities from free text.

Regex is deliberately used here instead of ML: phone numbers, UPI handles and
rupee amounts have rigid shapes, and deterministic extraction is easier to test
and explain than a learned tagger.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# --- Phone numbers ----------------------------------------------------------

# Indian mobile numbers: 10 digits starting 6-9, optional +91 / 91 / 0 prefix,
# separators allowed between groups (e.g. "+91 98765 43210", "98765-43210").
_PHONE_RE = re.compile(
    r"(?<![\d@.])"                     # not glued to another digit / handle
    r"(?:\+?91[\s-]?|0)?"              # optional country / trunk prefix
    r"([6-9]\d{4}[\s-]?\d{5})"         # 10 digits, optional separator in the middle
    r"(?!\d)"
)

# --- UPI IDs ----------------------------------------------------------------

# "name@handle" where the handle is a bare bank/PSP token (no dot after the @),
# which also keeps email addresses like "name@gmail.com" out of the match.
_UPI_RE = re.compile(r"(?<![\w.])([a-zA-Z0-9][a-zA-Z0-9._-]{1,63}@[a-zA-Z][a-zA-Z0-9]{1,31})(?!\.?\w)")

# --- Amounts ----------------------------------------------------------------

_NUM = r"(\d{1,3}(?:,\d{2,3})+|\d+)(?:\.(\d+))?"
_AMOUNT_RE = re.compile(
    r"(?:(?:₹|rs\.?|inr|rupees?)\s*" + _NUM + r"\s*(k|lakh|lac|l)?)"      # ₹4,999 / Rs 500 / INR 2k
    r"|(?:" + _NUM + r"\s*(k|lakh|lac|l)?\s*(?:/-|rupees?|rs\b|inr\b|₹))"   # 500/- / 500 rupees / 2 lakh rs
    r"|(?:\b" + _NUM + r"\s*(k|lakh|lac)\b)",                                # bare "2k" / "4 lakh"
    re.IGNORECASE,
)

_REQUEST_VERB_RE = re.compile(
    r"\b(pay|send|transfer|deposit|bhej|bhejo|bhejna|dena|de do|remit|clear|settle|recharge|charge|fee|fees|"
    r"amount|due|balance|pending|return|refund)\b",
    re.IGNORECASE,
)

_URL_RE = re.compile(r"\b(?:https?://|www\.)[^\s<>\"']+|\b[a-z0-9-]+\.(?:in|com|net|org|xyz|link|app|ly|co)(?:/[^\s]*)?", re.IGNORECASE)

# --- Keyword signals --------------------------------------------------------

KEYWORD_GROUPS: dict[str, list[str]] = {
    "urgency": [
        "immediately", "urgent", "urgently", "right now", "within 24 hours", "within 1 hour", "today only",
        "last chance", "final notice", "final warning", "expires today", "expire today", "will be blocked",
        "will be suspended", "will be deactivated", "abhi", "turant", "jaldi", "aaj hi", "asap", "before midnight",
        "within 2 hours", "within an hour", "last date",
    ],
    "kyc_credential": [
        "kyc", "verification", "verify your", "re-verify", "pan card", "aadhaar", "aadhar", "otp", "pin",
        "cvv", "account blocked", "account will be blocked", "account suspended", "update your details",
        "link your", "expired", "expires", "validate", "activate",
    ],
    "reward": [
        "cashback", "lottery", "lucky draw", "prize", "won", "winner", "congratulations", "reward", "gift",
        "scratch card", "claim", "bonus", "jackpot", "selected",
    ],
    "refund": ["refund", "reversal", "sent by mistake", "wrong transfer", "wrongly transferred", "galti se", "return the money", "return it"],
    "impersonation": [
        "bank", "sbi", "hdfc", "icici", "axis", "rbi", "npci", "customer care", "customer support", "helpline",
        "officer", "police", "cyber cell", "income tax", "electricity board", "telecom", "manager", "ceo",
        "hr team", "government", "govt", "official", "department", "dear customer", "dear user", "dear valued",
        "new number", "naya number", "phone broke", "kharab ho gaya", "friend's phone", "using a friend", "safe account",
        "verification account", "trai", "customs", "cbi", "ed officer",
    ],
    "upfront_fee": [
        "processing fee", "processing charge", "registration fee", "security deposit", "advance", "token amount",
        "activation fee", "handling charge", "release fee", "clearance fee", "service charge", "verification fee",
        "verification charge", "membership fee", "booking amount", "delivery charge", "unlock",
    ],
    "qr_link": ["scan", "qr", "qr code", "click", "link", "download", "install", "apk", "screen share", "anydesk", "teamviewer"],
    "investment": ["invest", "investment", "returns", "guaranteed", "double", "profit", "trading", "crypto", "stock tips", "daily income", "% return"],
    "job": ["job", "work from home", "part time", "part-time", "hiring", "salary", "task", "earn", "per day", "registration"],
    "marketplace": ["olx", "quikr", "buyer", "seller", "courier", "army", "cantonment", "advance payment", "delivery", "parcel"],
}


@dataclass
class ExtractedEntities:
    phone_numbers: list[str] = field(default_factory=list)
    upi_ids: list[str] = field(default_factory=list)
    amounts: list[float] = field(default_factory=list)
    urls: list[str] = field(default_factory=list)
    keywords: list[str] = field(default_factory=list)  # keyword group tags, e.g. ["urgency", "kyc_credential"]
    keyword_hits: dict[str, list[str]] = field(default_factory=dict)
    primary_amount: float | None = None

    @property
    def phone_number(self) -> str | None:
        return self.phone_numbers[0] if self.phone_numbers else None

    @property
    def upi_id(self) -> str | None:
        return self.upi_ids[0] if self.upi_ids else None

    @property
    def amount(self) -> float | None:
        return self.primary_amount

    def to_dict(self) -> dict:
        return {
            "phone_number": self.phone_number,
            "upi_id": self.upi_id,
            "amount": self.primary_amount,
            "amount_display": format_inr(self.primary_amount) if self.primary_amount is not None else None,
            "phone_numbers": list(self.phone_numbers),
            "upi_ids": list(self.upi_ids),
            "urls": list(self.urls),
            "keywords": list(self.keywords),
        }


# --- Normalisation ----------------------------------------------------------


def normalize_phone(raw: str) -> str | None:
    """Return +91XXXXXXXXXX for any recognisable Indian mobile number, else None."""
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    elif digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]
    if len(digits) == 10 and digits[0] in "6789":
        return f"+91{digits}"
    return None


def normalize_upi(raw: str) -> str | None:
    value = (raw or "").strip().lower()
    if _UPI_RE.fullmatch(value):
        return value
    return None


def classify_identifier(raw: str) -> tuple[str | None, str | None]:
    """Return (normalised identifier, type) where type is PHONE or UPI, or (None, None)."""
    phone = normalize_phone(raw)
    if phone:
        return phone, "PHONE"
    upi = normalize_upi(raw)
    if upi:
        return upi, "UPI"
    return None, None


def format_inr(amount: float) -> str:
    if amount is None:
        return ""
    whole = int(round(amount))
    if abs(amount - whole) > 1e-9:
        return f"₹{amount:,.2f}"
    # Indian digit grouping: last three, then pairs.
    s = str(whole)
    if len(s) <= 3:
        return f"₹{s}"
    head, tail = s[:-3], s[-3:]
    groups = []
    while len(head) > 2:
        groups.insert(0, head[-2:])
        head = head[:-2]
    if head:
        groups.insert(0, head)
    return "₹" + ",".join(groups) + "," + tail


# --- Extraction -------------------------------------------------------------


def _parse_amount(match: re.Match) -> float | None:
    groups = match.groups()
    # Either prefix form (groups 0..2) or suffix form (groups 3..5)
    if groups[0] is not None:
        whole, frac, unit = groups[0], groups[1], groups[2]
    elif groups[3] is not None:
        whole, frac, unit = groups[3], groups[4], groups[5]
    else:
        whole, frac, unit = groups[6], groups[7], groups[8]
    if whole is None:
        return None
    number = float(whole.replace(",", "") + (f".{frac}" if frac else ""))
    unit = (unit or "").lower()
    if unit == "k":
        number *= 1_000
    elif unit in {"lakh", "lac", "l"}:
        number *= 100_000
    if number <= 0 or number > 10_000_000:
        return None
    return number


def extract_amounts(text: str) -> list[tuple[float, int]]:
    """Return [(amount, char_position)] in order of appearance."""
    results: list[tuple[float, int]] = []
    for match in _AMOUNT_RE.finditer(text):
        value = _parse_amount(match)
        if value is not None:
            results.append((value, match.start()))
    return results


def choose_primary_amount(text: str, amounts: list[tuple[float, int]]) -> float | None:
    """Prefer the amount that follows a request verb ("pay ₹499"), else the first one."""
    if not amounts:
        return None
    best: tuple[int, float] | None = None
    for value, pos in amounts:
        window = text[max(0, pos - 45):pos]
        verbs = list(_REQUEST_VERB_RE.finditer(window))
        if verbs:
            distance = len(window) - verbs[-1].end()  # closest verb before the amount
            if best is None or distance < best[0]:
                best = (distance, value)
    if best:
        return best[1]
    return amounts[0][0]


def extract_entities(text: str) -> ExtractedEntities:
    text = text or ""
    lowered = text.lower()

    upi_ids: list[str] = []
    for match in _UPI_RE.finditer(text):
        value = match.group(1).lower()
        if value not in upi_ids:
            upi_ids.append(value)

    # Remove UPI handles before phone search so "9876543210@ybl" is not double-counted as a phone.
    scrubbed = _UPI_RE.sub(" ", text)
    phones: list[str] = []
    for match in _PHONE_RE.finditer(scrubbed):
        norm = normalize_phone(match.group(0))
        if norm and norm not in phones:
            phones.append(norm)

    amounts = extract_amounts(text)
    urls = []
    # Drop e-mail addresses before URL search so "name@gmail.com" does not yield "gmail.com".
    without_emails = re.sub(r"[\w.+-]+@[\w-]+\.[\w.-]+", " ", text)
    for match in _URL_RE.finditer(without_emails):
        url = match.group(0).rstrip(".,)")
        if url not in urls:
            urls.append(url)

    # Keyword matching runs on prose only: handles like "x@oksbi" must not count as a bank mention.
    prose = _URL_RE.sub(" ", _UPI_RE.sub(" ", lowered))
    keyword_hits: dict[str, list[str]] = {}
    for group, phrases in KEYWORD_GROUPS.items():
        hits = [p for p in phrases if re.search(r"(?<![a-z])" + re.escape(p) + r"(?![a-z])", prose)]
        if hits:
            keyword_hits[group] = hits

    return ExtractedEntities(
        phone_numbers=phones,
        upi_ids=upi_ids,
        amounts=[a for a, _ in amounts],
        urls=urls,
        keywords=list(keyword_hits.keys()),
        keyword_hits=keyword_hits,
        primary_amount=choose_primary_amount(text, amounts),
    )
