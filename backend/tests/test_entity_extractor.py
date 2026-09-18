from services.entity_extractor import classify_identifier, extract_entities, format_inr, normalize_phone, normalize_upi


def test_phone_extraction_and_normalisation_variants():
    for raw in ["9876543210", "+91 98765 43210", "+919876543210", "098765-43210", "91 9876543210"]:
        assert normalize_phone(raw) == "+919876543210", raw
    assert normalize_phone("1234567890") is None  # Indian mobiles start 6-9
    assert normalize_phone("98765") is None


def test_phone_extraction_from_text():
    ents = extract_entities("Call our helpline +91 98765 43210 now or 0987654321 later")
    assert ents.phone_numbers == ["+919876543210"]


def test_upi_extraction_and_normalisation():
    ents = extract_entities("Pay to SecureVerify@UPI or rewards.claim@ybl. Mail me at test@gmail.com")
    assert ents.upi_ids == ["secureverify@upi", "rewards.claim@ybl"]
    assert normalize_upi("Rahul@OkSBI") == "rahul@oksbi"
    assert normalize_upi("not a upi") is None
    assert normalize_upi("name@gmail.com") is None


def test_upi_at_sentence_end_is_extracted():
    assert extract_entities("Send to verifybank@oksbi.").upi_ids == ["verifybank@oksbi"]


def test_phone_style_upi_is_not_double_counted_as_phone():
    ents = extract_entities("pay via 9876543210@ybl")
    assert ents.upi_ids == ["9876543210@ybl"]
    assert ents.phone_numbers == []


def test_amount_extraction_formats():
    cases = {
        "Send ₹4,999 now": 4999.0,
        "Pay Rs. 500/- today": 500.0,
        "transfer INR 2500": 2500.0,
        "bring 300 rupees": 300.0,
        "send 5k to me": 5000.0,
        "invest 2 lakh": 200000.0,
    }
    for text, expected in cases.items():
        assert extract_entities(text).primary_amount == expected, text


def test_primary_amount_prefers_the_requested_one():
    ents = extract_entities("You have received ₹25,000 cashback. Pay ₹499 processing charge to claim.")
    assert ents.amounts == [25000.0, 499.0]
    assert ents.primary_amount == 499.0


def test_expected_example_from_spec():
    ents = extract_entities("Your KYC will expire today. Send ₹4,999 to securebank@upi or call 9876543210 immediately.")
    assert ents.upi_id == "securebank@upi"
    assert ents.phone_number == "+919876543210"
    assert ents.amount == 4999.0
    assert "urgency" in ents.keywords and "kyc_credential" in ents.keywords


def test_plain_conversation_has_no_entities():
    ents = extract_entities("Meeting room 4, floor 12, see you at 2026 conference")
    assert ents.upi_ids == [] and ents.phone_numbers == [] and ents.primary_amount is None


def test_url_extraction_ignores_emails():
    ents = extract_entities("open bit.ly/abc123 or http://kyc-update.xyz/x but mail me a@b.com")
    assert "bit.ly/abc123" in ents.urls and "http://kyc-update.xyz/x" in ents.urls
    assert all("b.com" != u for u in ents.urls)


def test_keywords_ignore_bank_names_inside_handles():
    ents = extract_entities("Invoice from Blue Dart for Rs 350. UPI ID bluedart2@sbi")
    assert "impersonation" not in ents.keywords


def test_classify_identifier():
    assert classify_identifier("+91 98765 43210") == ("+919876543210", "PHONE")
    assert classify_identifier("Rahul@oksbi") == ("rahul@oksbi", "UPI")
    assert classify_identifier("garbage") == (None, None)


def test_format_inr_indian_grouping():
    assert format_inr(4999) == "₹4,999"
    assert format_inr(250000) == "₹2,50,000"
    assert format_inr(499.5) == "₹499.50"
