"""API-level tests: correlation, reporting, unknown payees and the critical end-to-end flow."""

KYC = "Your KYC expires today. Pay ₹4,999 immediately to fraudtest@upi or your account will be suspended."


def test_health(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True
    assert body["metrics"]["dataset_rows"] >= 2000


def test_critical_flow_message_then_payment_is_interrupted(client):
    # 1. Submit a suspicious message containing fraudtest@upi
    analysis = client.post("/api/analyze-message", json={"message": KYC}).json()
    assert analysis["intent"] == "KYC_SCAM"
    assert analysis["risk_band"] == "HIGH"
    assert analysis["entities"]["upi_id"] == "fraudtest@upi"
    assert analysis["entities"]["amount"] == 4999.0

    # 2. The identifier now carries risk
    risk = client.get("/api/risk/fraudtest@upi").json()
    assert risk["risk_band"] in {"SUSPICIOUS", "HIGH_RISK"}
    assert risk["suspicious_message_count"] == 1
    assert risk["last_intent"] == "KYC_SCAM"

    # 3./4. Verify payee -> interruption
    verify = client.post("/api/verify-payee", json={"identifier": "FraudTest@UPI", "amount": 4999}).json()
    assert verify["decision"] == "INTERRUPT"
    assert verify["risk_band"] == "HIGH"
    assert verify["matched_context"] is True
    assert verify["matched_message"]["id"] == analysis["id"]
    assert verify["matched_message"]["amount_match"] is True

    # 5. Explanation references the earlier suspicious context and the amount
    assert "earlier suspicious message" in verify["summary"]
    assert "₹4,999" in verify["summary"]
    assert any("KYC" in r or "kyc" in r for r in verify["reasons"])
    assert any(s["code"] == "CONTEXT_MATCH" for s in verify["signals"])
    assert any(s["code"] == "AMOUNT_MATCH" for s in verify["signals"])

    # 6. Cancel & report creates a fraud report and records the decision
    report = client.post("/api/report-fraud", json={"identifier": "fraudtest@upi", "verification_id": verify["verification_id"]}).json()
    assert report["report"]["source"] == "PAYMENT_CANCEL"
    assert report["identifier_risk"]["report_count"] == 1
    assert report["identifier_risk"]["risk_band"] == "HIGH_RISK"

    dash = client.get("/api/dashboard").json()
    assert dash["totals"]["cancelled"] == 1 and dash["totals"]["reports"] == 1
    assert dash["cancelled_payments"][0]["user_action"] == "CANCELLED_REPORTED"


def test_correlation_without_amount_match_still_interrupts(client):
    client.post("/api/analyze-message", json={"message": KYC})
    verify = client.post("/api/verify-payee", json={"identifier": "fraudtest@upi", "amount": 1500}).json()
    assert verify["decision"] == "INTERRUPT"
    assert verify["matched_context"] is True
    assert verify["matched_message"]["amount_match"] is False
    assert "previously appeared in a suspicious message" in verify["summary"]


def test_phone_number_payee_is_correlated(client):
    msg = "Dear customer, your SBI account will be blocked today. Pay ₹2,000 verification charge immediately. Call 98765 43210."
    analysis = client.post("/api/analyze-message", json={"message": msg}).json()
    assert analysis["entities"]["phone_number"] == "+919876543210"
    assert analysis["risk_band"] in {"MEDIUM", "HIGH"}
    verify = client.post("/api/verify-payee", json={"identifier": "+91 98765 43210", "amount": 2000}).json()
    assert verify["identifier"] == "+919876543210" and verify["identifier_type"] == "PHONE"
    assert verify["matched_context"] is True
    assert verify["decision"] == "INTERRUPT"


def test_normal_message_does_not_create_high_risk_identifier(client):
    analysis = client.post("/api/analyze-message", json={"message": "Send ₹300 for lunch to rahul@oksbi"}).json()
    assert analysis["risk_band"] == "LOW"
    risk = client.get("/api/risk/rahul@oksbi").json()
    assert risk["risk_band"] == "LOW"
    assert risk["suspicious_message_count"] == 0
    verify = client.post("/api/verify-payee", json={"identifier": "rahul@oksbi", "amount": 300}).json()
    assert verify["decision"] == "ALLOW"
    assert verify["matched_context"] is False
    assert verify["title"] == "PausePay check complete"


def test_unknown_payee_is_not_called_fraud(client):
    risk = client.get("/api/risk/meera.iyer@okhdfcbank").json()
    assert risk["risk_band"] == "UNKNOWN" and risk["report_count"] == 0
    verify = client.post("/api/verify-payee", json={
        "identifier": "meera.iyer@okhdfcbank", 
        "amount": 1200,
        "context": {"payment": {"payment_hour": 14}}
    }).json()
    assert verify["decision"] == "ALLOW"
    assert verify["risk_score"] == 8
    assert verify["identifier_risk"]["risk_band"] == "UNKNOWN"
    assert "no evidence" in verify["summary"].lower()


def test_seeded_confirmed_fraud_identifier_interrupts(client):
    verify = client.post("/api/verify-payee", json={"identifier": "refund.desk@ybl", "amount": 5000}).json()
    assert verify["decision"] == "INTERRUPT"
    assert verify["identifier_risk"]["status"] == "CONFIRMED_FRAUD"
    assert "confirmed-fraud list" in verify["summary"]


def test_reports_accumulate_and_flag_future_checks(client):
    first = client.post("/api/report-fraud", json={"identifier": "newscammer@upi", "reason": "asked for OTP"}).json()
    assert first["identifier_risk"]["report_count"] == 1
    assert first["identifier_risk"]["risk_band"] == "SUSPICIOUS"
    second = client.post("/api/report-fraud", json={"identifier": "newscammer@upi"}).json()
    assert second["identifier_risk"]["report_count"] == 2
    assert second["identifier_risk"]["risk_band"] == "HIGH_RISK"
    verify = client.post("/api/verify-payee", json={"identifier": "newscammer@upi", "amount": 100}).json()
    assert verify["decision"] in {"REVIEW", "INTERRUPT"}
    assert "reported" in verify["summary"]


def test_repeated_messenger_message_is_not_double_counted(client):
    body = {"message": KYC, "source": "MESSENGER_SIM", "source_ref": "kyc-1"}
    first = client.post("/api/analyze-message", json=body).json()
    second = client.post("/api/analyze-message", json=body).json()
    assert first["id"] == second["id"] and second["cached"] is True
    assert client.get("/api/risk/fraudtest@upi").json()["suspicious_message_count"] == 1


def test_payment_decision_records_continue_after_warning(client):
    client.post("/api/analyze-message", json={"message": KYC})
    verify = client.post("/api/verify-payee", json={"identifier": "fraudtest@upi", "amount": 4999}).json()
    decided = client.post(f"/api/payments/{verify['verification_id']}/decision", json={"action": "CONTINUED_AFTER_WARNING"}).json()
    assert decided["user_action"] == "CONTINUED_AFTER_WARNING"
    assert client.get("/api/dashboard").json()["totals"]["continued_after_warning"] == 1


def test_validation_errors(client):
    assert client.post("/api/analyze-message", json={"message": "   "}).status_code == 422
    assert client.post("/api/verify-payee", json={"identifier": "nonsense", "amount": 10}).status_code == 422
    assert client.post("/api/verify-payee", json={"identifier": "a@b", "amount": 0}).status_code == 422
    assert client.get("/api/risk/nonsense").status_code == 422


def test_history_and_conversations(client):
    client.post("/api/analyze-message", json={"message": KYC})
    history = client.get("/api/analysis-history").json()
    assert len(history["analyses"]) == 1
    convs = client.get("/api/conversations").json()
    assert any(c["id"] == "kyc-alert" for c in convs)
