"""Tests for the contextual evidence layer, unique signal deduplication, mitigators, and overrides."""

import pytest

from services.risk_engine import (
    AMOUNT_ABOVE_BASELINE,
    COUNTERPARTY_MISMATCH,
    CREDENTIAL_OR_PIN_REQUEST,
    ESTABLISHED_PAYEE,
    FIRST_TIME_PAYEE,
    INBOUND_CREDIT_UNVERIFIED,
    INBOUND_CREDIT_VERIFIED,
    LOOKALIKE_VPA,
    MISTAKEN_TRANSFER_CLAIM,
    OFF_PATTERN_HOUR,
    PAYEE_IN_CONTACTS,
    PAYEE_SOURCED_FROM_MESSAGE,
    PERSONAL_VPA_IN_MERCHANT_CONTEXT,
    QR_SCANNED_IN_PERSON,
    SHORT_LATENCY_AFTER_MESSAGE,
    SIGNAL_FAMILY,
    VELOCITY_BURST,
    VERIFIED_MERCHANT_VPA,
    VPA_NAME_MISMATCH,
    assess_context,
    assess_payment,
    band_for,
)


def test_base_behavior_preserved_without_context():
    assessment = assess_payment(
        amount=500.0,
        record=None,
        matched_message=None,
        amount_match=False,
        hours_since_message=None,
        context=None,
    )
    assert assessment.score == 0
    assert assessment.band == "LOW"
    assert assessment.signals == []
    assert assessment.mitigators == []
    assert assessment.override is False
    assert assessment.override_reason is None


def test_rule_a_unverified_incoming_credit():
    ctx = {
        "message": {"claims_incoming_transfer": True, "claimed_amount": 5000},
        "ledger": {"matching_credit_found": False},
    }
    assessment = assess_context(ctx)
    codes = assessment.signal_codes()
    assert "INBOUND_CREDIT_UNVERIFIED" in codes
    sig = next(s for s in assessment.signals if s.code == "INBOUND_CREDIT_UNVERIFIED")
    assert sig.weight == INBOUND_CREDIT_UNVERIFIED == 22
    assert sig.family == "context"


def test_rule_b_counterparty_mismatch():
    ctx = {
        "message": {"claimed_sender_identifier": "Amit"},
        "payment": {"payee_identifier": "rahul@upi", "amount": 5000},
    }
    assessment = assess_context(ctx)
    codes = assessment.signal_codes()
    assert "COUNTERPARTY_MISMATCH" in codes
    sig = next(s for s in assessment.signals if s.code == "COUNTERPARTY_MISMATCH")
    assert sig.weight == COUNTERPARTY_MISMATCH == 25
    assert sig.family == "context"


def test_hero_scenario_refund_scam_triggers_high_override():
    """Unverified inbound credit + counterparty mismatch must override band to HIGH."""
    ctx = {
        "ledger": {
            "matching_credit_found": False,
            "matching_credit_amount": 0,
        },
        "message": {
            "claimed_sender": "Amit",
            "claimed_payee": "rahul@upi",
            "claimed_amount": 5000,
            "mistaken_transfer": True,
            "claims_incoming_transfer": True,
            "claimed_sender_identifier": "Amit",
        },
        "payment": {
            "payee": "rahul@upi",
            "amount": 5000,
            "payee_identifier": "rahul@upi",
        },
    }
    assessment = assess_context(ctx)
    codes = assessment.signal_codes()
    assert "INBOUND_CREDIT_UNVERIFIED" in codes
    assert "COUNTERPARTY_MISMATCH" in codes
    assert "MISTAKEN_TRANSFER_CLAIM" in codes
    assert assessment.band == "HIGH"
    assert assessment.override is True
    assert "refund scam" in (assessment.override_reason or "").lower()


def test_behavioral_signals_only_fire_when_data_exists():
    # Empty behavior data: no signals added
    empty_ctx = {"behavior": {}, "payee": {}}
    assessment = assess_context(empty_ctx)
    assert assessment.score == 0
    assert assessment.signals == []

    # Populated behavior data
    ctx = {
        "behavior": {
            "typical_amount": 1000,
            "current_amount": 5000,
            "recent_payment_count": 4,
            "typical_hour_start": 9,
            "typical_hour_end": 21,
        },
        "payee": {
            "is_first_time": True,
        },
        "payment": {
            "amount": 5000,
            "payment_hour": 3,
        },
    }
    assessment = assess_context(ctx)
    codes = assessment.signal_codes()
    assert "FIRST_TIME_PAYEE" in codes
    assert "AMOUNT_ABOVE_BASELINE" in codes
    assert "VELOCITY_BURST" in codes
    assert "OFF_PATTERN_HOUR" in codes

    # Sum of weights: 8 + 12 + 10 + 4 = 34 (LOW band boundary)
    assert assessment.score == 34
    assert assessment.band == "LOW"


def test_credential_pin_request_triggers_immediate_high_override():
    ctx = {
        "message": {
            "credential_or_pin_request": True,
        }
    }
    assessment = assess_context(ctx)
    assert "CREDENTIAL_OR_PIN_REQUEST" in assessment.signal_codes()
    assert assessment.band == "HIGH"
    assert assessment.override is True
    assert "pin" in (assessment.override_reason or "").lower()


def test_mitigators_decrease_risk_score():
    ctx_without_mitigators = {
        "payee": {"is_first_time": True},
        "behavior": {"typical_amount": 1000, "current_amount": 4000},
        "payment": {"amount": 4000},
    }
    a_base = assess_context(ctx_without_mitigators)
    assert a_base.score == 20  # 8 (FIRST_TIME) + 12 (ABOVE_BASELINE)

    ctx_with_mitigators = {
        "behavior": {"typical_amount": 1000, "current_amount": 4000},
        "payment": {"amount": 4000},
        "payee": {
            "is_first_time": False,
            "in_contacts": True,
            "established_payment_count": 5,
            "verified_merchant": True,
        },
        "ledger": {
            "matching_credit_found": True,
            "matching_credit_amount": 4000,
        },
    }
    a_mitigated = assess_context(ctx_with_mitigators)
    # Signals: AMOUNT_ABOVE_BASELINE (12)
    # Mitigators: INBOUND_CREDIT_VERIFIED (-20), ESTABLISHED_PAYEE (-15), PAYEE_IN_CONTACTS (-10), VERIFIED_MERCHANT_VPA (-12)
    # Clamped to 0
    assert a_mitigated.score == 0
    assert a_mitigated.band == "LOW"
    m_codes = a_mitigated.mitigator_codes()
    assert "INBOUND_CREDIT_VERIFIED" in m_codes
    assert "ESTABLISHED_PAYEE" in m_codes
    assert "PAYEE_IN_CONTACTS" in m_codes
    assert "VERIFIED_MERCHANT_VPA" in m_codes


def test_signal_deduplication_preserves_unique_codes():
    ctx = {
        "message": {
            "claimed_sender_identifier": "Unknown",
            "mistaken_transfer": True,
            "urgency_pressure": True,
        },
        "payment": {
            "payee_identifier": "payee@upi",
            "amount": 2000,
        },
    }
    assessment = assess_context(ctx)
    codes = [s.code for s in assessment.signals]
    assert len(codes) == len(set(codes))


def test_family_metadata_and_rich_representation():
    ctx = {
        "message": {"claims_incoming_transfer": True, "urgency_pressure": True},
        "ledger": {"matching_credit_found": False},
        "payee": {"is_first_time": True, "vpa_name_mismatch": True},
    }
    assessment = assess_context(ctx)
    d = assessment.to_dict()
    assert "score" in d and "band" in d
    assert "signals" in d and "mitigators" in d
    assert "families" in d
    assert "context" in assessment.families
    assert "social_engineering" in assessment.families
    assert "transaction" in assessment.families
    assert "payee_identity" in assessment.families


def test_api_verify_payee_with_context(client):
    payload = {
        "identifier": "amit.refund@okhdfcbank",
        "amount": 5000,
        "context": {
            "ledger": {"matching_credit_found": False},
            "message": {
                "claims_incoming_transfer": True,
                "claimed_sender_identifier": "Amit Kumar",
                "mistaken_transfer": True,
            },
            "payment": {
                "payee_identifier": "amit.refund@okhdfcbank",
                "amount": 5000,
            },
            "payee": {
                "is_first_time": True,
            },
        },
    }
    resp = client.post("/api/verify-payee", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"] == "INTERRUPT"
    assert data["risk_band"] == "HIGH"
    assert data["override"] is True
    signal_codes = {s["code"] for s in data["signals"]}
    assert "INBOUND_CREDIT_UNVERIFIED" in signal_codes
    assert "COUNTERPARTY_MISMATCH" in signal_codes
    assert "context" in data["families"]


def test_synthetic_ledger_api_endpoints(client):
    # 1. Fetch default ledger
    resp = client.get("/api/ledger")
    assert resp.status_code == 200
    entries = resp.json()
    assert len(entries) >= 3
    amounts = [e["amount"] for e in entries]
    assert 2000.0 in amounts
    assert 300.0 in amounts
    assert 1500.0 in amounts

    # 2. Check ₹5,000 -> NO MATCH
    check_no_match = client.post("/api/ledger/check", json={"amount": 5000.0}).json()
    assert check_no_match["matched"] is False
    assert check_no_match["unverified_incoming"] is True
    assert "No matching incoming ₹5,000 credit found" in check_no_match["summary"]

    # 3. Check ₹2,000 -> MATCH
    check_match = client.post("/api/ledger/check", json={"amount": 2000.0}).json()
    assert check_match["matched"] is True
    assert check_match["unverified_incoming"] is False
    assert "Matching incoming credit of ₹2,000 found" in check_match["summary"]


def test_hero_refund_scam_automatically_queries_synthetic_ledger(client):
    """Hero Scenario: Scammer claims accidental transfer; PausePay checks simulated ledger -> NO MATCH -> INTERRUPT."""
    # 1. Analyze incoming message claiming accidental ₹5,000 transfer
    msg = "I accidentally sent ₹5,000 to your number. Please return it immediately to refund.claim@ybl"
    analysis_resp = client.post(
        "/api/analyze-message",
        json={"message": msg, "sender_label": "Amit Kumar"},
    )
    assert analysis_resp.status_code == 200
    analysis = analysis_resp.json()
    assert analysis["intent"] == "REFUND_SCAM"
    # Automatic ledger query detects that ₹5,000 is not in user ledger
    signal_codes = {s["code"] for s in analysis["signals"]}
    assert "INBOUND_CREDIT_UNVERIFIED" in signal_codes

    # 2. User initiates payment to refund.claim@ybl for ₹5,000
    verify_resp = client.post(
        "/api/verify-payee",
        json={"identifier": "refund.claim@ybl", "amount": 5000},
    )
    assert verify_resp.status_code == 200
    verify = verify_resp.json()
    assert verify["decision"] == "INTERRUPT"
    assert verify["risk_band"] == "HIGH"
    assert verify["override"] is True
    assert "refund scam" in verify["override_reason"].lower()

    # Ledger check details are included in response
    assert verify["ledger_check"] is not None
    assert verify["ledger_check"]["matched"] is False
    assert verify["ledger_check"]["unverified_incoming"] is True
    assert "No matching incoming ₹5,000 credit found" in verify["ledger_check"]["summary"]

    # Explanations explicitly cite the unverified ledger credit
    assert any("bank ledger" in r.lower() for r in verify["reasons"])


def test_legitimate_credit_entry_in_ledger_verifies(client):
    """Simulate a legitimate case: Add ₹5,000 credit to ledger, then verification sees it."""
    # Add ₹5,000 incoming credit from Amit
    add_resp = client.post(
        "/api/ledger/entries",
        json={
            "entry_type": "CREDIT",
            "amount": 5000.0,
            "counterparty": "Amit Kumar",
            "description": "UPI transfer from Amit",
        },
    )
    assert add_resp.status_code == 200

    # Ledger check now finds the match
    check = client.post("/api/ledger/check", json={"amount": 5000.0}).json()
    assert check["matched"] is True
    assert check["unverified_incoming"] is False
    assert check["matching_entry"]["amount"] == 5000.0

    # Reset ledger restores default state
    reset_resp = client.post("/api/ledger/reset")
    assert reset_resp.status_code == 200
    check_after_reset = client.post("/api/ledger/check", json={"amount": 5000.0}).json()
    assert check_after_reset["matched"] is False

