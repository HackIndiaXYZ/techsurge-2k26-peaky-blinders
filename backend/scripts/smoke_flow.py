"""Quick end-to-end smoke run against an isolated SQLite file (no server needed)."""
import os, sys, warnings
from pathlib import Path
warnings.filterwarnings("ignore")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["PAUSEPAY_DATABASE_URL"] = "sqlite:///./data/smoke.db"
from fastapi.testclient import TestClient
from main import app

def show(label, r):
    print(f"\n== {label}")
    for k in ("intent", "decision", "risk_score", "risk_band", "title", "summary", "reasons"):
        if k in r:
            print(f"  {k}: {r[k]}")
    if "signals" in r:
        print("  signals:", [(s["code"], s["weight"]) for s in r["signals"]])

with TestClient(app) as c:
    print("health:", c.get("/api/health").json()["status"])
    show("B1 KYC message", c.post("/api/analyze-message", json={"message": "Your KYC expires today. Pay ₹4,999 immediately to secureverify@upi or your account will be suspended."}).json())
    show("B2 pay secureverify@upi 4999", c.post("/api/verify-payee", json={"identifier": "secureverify@upi", "amount": 4999}).json())
    show("A1 lunch message", c.post("/api/analyze-message", json={"message": "Send ₹300 for lunch to rahul@oksbi"}).json())
    show("A2 pay rahul@oksbi 300", c.post("/api/verify-payee", json={"identifier": "rahul@oksbi", "amount": 300}).json())
    show("D unknown payee", c.post("/api/verify-payee", json={"identifier": "meera.iyer@okhdfcbank", "amount": 1200}).json())
    show("seed list payee", c.post("/api/verify-payee", json={"identifier": "refund.desk@ybl", "amount": 5000}).json())
    show("non-payment KYC chat", c.post("/api/analyze-message", json={"message": "Went to the SBI branch for KYC today, took 40 minutes. Finally done."}).json())
    show("hospital deposit (legit urgent)", c.post("/api/analyze-message", json={"message": "Lakeview Hospital: admission deposit of ₹18,000 for patient Suresh K is due today so the admission can be completed. Pay at the billing counter or to UPI lakeviewhospital@icici. Receipt will be issued."}).json())
    show("C prize", c.post("/api/analyze-message", json={"message": "Congratulations! You won ₹25,000 cashback. Pay ₹499 processing fee to rewards.claim@upi to receive it today."}).json())
    show("refund scam w/ seeded upi", c.post("/api/analyze-message", json={"message": "Hi, I accidentally sent ₹5,000 to your number by mistake. Please return it immediately to refund.desk@ybl, it was my rent money."}).json())
    show("dinner", c.post("/api/analyze-message", json={"message": "Anytime. Bro send ₹250 for yesterday's dinner. UPI: arjun@oksbi"}).json())
    r = c.post("/api/report-fraud", json={"identifier": "secureverify@upi", "verification_id": 1}).json()
    print("\nreport:", r["message"], r["identifier_risk"]["risk_band"], r["identifier_risk"]["risk_score"])
    print("dashboard:", c.get("/api/dashboard").json()["totals"])
    print("risk lookup:", c.get("/api/risk/+91 90000 00001").json()["risk_band"])
