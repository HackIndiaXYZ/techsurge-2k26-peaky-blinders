"""Generate the synthetic Indian digital-payment message dataset.

Usage:
    python scripts/generate_dataset.py [--rows 4000] [--seed 42] [--out data/payment_messages.csv]

Every row is produced from intent-specific templates filled with randomised
slots (names, UPI handles, banks, amounts, phone numbers, urgency phrases) in
English and Hinglish. The generator is fully seeded so the dataset is
reproducible; no rows are hand-written.
"""

from __future__ import annotations

import argparse
import csv
import random
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from services.entity_extractor import extract_entities  # noqa: E402

# ---------------------------------------------------------------------------
# Slot pools
# ---------------------------------------------------------------------------

FIRST_NAMES = [
    "Rahul", "Priya", "Arjun", "Sneha", "Vikram", "Anjali", "Rohan", "Neha", "Karan", "Pooja", "Amit", "Divya",
    "Sanjay", "Meera", "Aditya", "Kavya", "Nikhil", "Riya", "Suresh", "Lakshmi", "Manish", "Ananya", "Deepak",
    "Shreya", "Varun", "Ishita", "Rajesh", "Nisha", "Harsh", "Tanvi", "Farhan", "Zoya", "Joseph", "Simran",
    "Gurpreet", "Ayesha", "Naveen", "Bhavya", "Kiran", "Ritu",
]
RELATIONS = ["Mom", "Dad", "Bhai", "Didi", "Papa", "Mummy", "Chacha", "Mama", "Bua", "Nani"]
LEGIT_HANDLES = ["oksbi", "okaxis", "okicici", "okhdfcbank", "ybl", "paytm", "ibl", "axl", "apl", "upi", "ptsbi", "ptaxis", "waaxis", "fbl"]
BANKS = ["SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Bank", "PNB", "Bank of Baroda", "Canara Bank", "Yes Bank", "IDFC First"]
APPS = ["GPay", "PhonePe", "Paytm", "BHIM", "Amazon Pay"]
MERCHANTS = [
    "Sharma General Store", "Fresh Basket", "City Pharmacy", "Cafe Nirvana", "Metro Cabs", "Quick Laundry",
    "Green Grocers", "Sai Electricals", "Book Corner", "Royal Bakery", "FitLife Gym", "Sunrise Tuition",
    "Om Sweets", "Lakeview Hospital", "Blue Dart", "Urban Salon", "Deluxe Tailors", "Star Mobile Repair",
]
MERCHANT_HANDLE = ["paytmqr", "okbizaxis", "ybl", "icici", "hdfcbank", "axisbank", "sbi", "upi"]
BILLERS = ["BESCOM", "MSEDCL", "Tata Power", "Airtel", "Jio", "Vi", "ACT Fibernet", "BSNL", "Adani Gas", "Mahanagar Gas", "BWSSB", "Delhi Jal Board"]
SCAM_UPI_NAMES = [
    "securebank", "kycupdate", "verifybank", "rewards.claim", "refund.desk", "lottery.claim", "sbi.kyc", "hdfc.verify",
    "jobportal.fee", "invest.pro", "courier.pay", "prize.center", "cashback.claim", "support.desk", "bank.verify",
    "kyc.support", "customer.care", "npci.verify", "refundteam", "claimprize", "quickloan", "tradepro", "hrdesk",
    "electricity.pay", "bill.desk", "urgentkyc", "verify.now", "official.support", "reward.claim", "task.fee",
]
SCAM_HANDLES = ["upi", "ybl", "paytm", "axl", "ibl", "oksbi", "okaxis"]
ORDER_PREFIX = ["ORD", "AMZ", "FLP", "MYN", "ZMT", "SWG"]
SHORT_LINKS = ["bit.ly/{tok}", "tinyurl.com/{tok}", "kyc-update-{tok}.in", "sbi-verify-{tok}.xyz", "reward-claim-{tok}.link", "cutt.ly/{tok}"]

URGENCY_PHRASES = [
    "immediately", "right now", "within 24 hours", "within 1 hour", "today only", "before midnight", "urgently",
    "within 2 hours", "asap", "abhi", "turant", "jaldi", "aaj hi", "last chance", "final notice",
]
CONSEQUENCES = [
    "or your account will be blocked", "otherwise your account will be suspended", "or services will be deactivated",
    "else your card will be permanently blocked", "or your number will be disconnected", "or legal action will be taken",
    "warna account block ho jayega", "nahi toh account band ho jayega", "or the amount will be forfeited",
]
GREETINGS_FORMAL = ["Dear customer,", "Dear user,", "Dear valued customer,", "Attention:", "Alert:", "Notice:", "Dear account holder,", ""]
GREETINGS_CASUAL = ["Hey", "Hi", "Bro", "Yaar", "Hello", "Arre", "Dude", "Hi da", "Oye", ""]


def rnd_phone(rng: random.Random) -> str:
    return rng.choice("6789") + "".join(rng.choice("0123456789") for _ in range(9))


def fmt_phone(rng: random.Random, digits: str) -> str:
    style = rng.random()
    if style < 0.35:
        return digits
    if style < 0.55:
        return f"+91 {digits[:5]} {digits[5:]}"
    if style < 0.75:
        return f"+91{digits}"
    if style < 0.9:
        return f"{digits[:5]}-{digits[5:]}"
    return f"0{digits}"


def fmt_amount(rng: random.Random, amount: int) -> str:
    grouped = f"{amount:,}"
    style = rng.random()
    if style < 0.45:
        return f"₹{grouped}"
    if style < 0.6:
        return f"Rs {amount}"
    if style < 0.72:
        return f"Rs. {grouped}/-"
    if style < 0.82:
        return f"{amount} rupees"
    if style < 0.88:
        return f"INR {amount}"
    if style < 0.94 and amount % 1000 == 0 and amount >= 1000:
        return f"{amount // 1000}k"
    return str(amount)  # bare number, as people often type it in chat


def legit_upi(rng: random.Random, name: str | None = None) -> str:
    name = (name or rng.choice(FIRST_NAMES)).lower()
    suffix = rng.choice(["", "", str(rng.randint(1, 99)), rng.choice(FIRST_NAMES).lower()[:3], "." + rng.choice(["sharma", "patel", "iyer", "khan", "singh", "das"])])
    return f"{name}{suffix}@{rng.choice(LEGIT_HANDLES)}"


def scam_upi(rng: random.Random) -> str:
    base = rng.choice(SCAM_UPI_NAMES)
    if rng.random() < 0.3:
        base += str(rng.randint(1, 999))
    return f"{base}@{rng.choice(SCAM_HANDLES)}"


def merchant_upi(rng: random.Random, merchant: str) -> str:
    slug = merchant.lower().replace(" ", "").replace("'", "")[:12]
    return f"{slug}{rng.choice(['', str(rng.randint(1, 9))])}@{rng.choice(MERCHANT_HANDLE)}"


def short_link(rng: random.Random) -> str:
    tok = "".join(rng.choice("abcdefghijklmnopqrstuvwxyz0123456789") for _ in range(rng.randint(4, 7)))
    return rng.choice(SHORT_LINKS).format(tok=tok)


def order_id(rng: random.Random) -> str:
    return f"{rng.choice(ORDER_PREFIX)}{rng.randint(100000, 999999)}"


# ---------------------------------------------------------------------------
# Template builders. Each returns (message, meta) where meta carries labels.
# ---------------------------------------------------------------------------

Row = dict[str, object]


def _row(message: str, intent: str, *, fraud: bool, payment: bool, urgency: bool, impersonation: bool, amount: int | None, upi: str | None, phone: str | None, risk: str | None = None) -> Row:
    if risk is None:
        risk = "HIGH" if fraud else ("LOW" if not payment else "LOW")
    return {
        "message": " ".join(message.split()),
        "intent": intent,
        "is_payment_related": payment,
        "is_fraud": fraud,
        "risk_label": risk,
        "phone_number": phone,
        "upi_id": upi,
        "amount": amount,
        "urgency": urgency,
        "impersonation": impersonation,
    }


def gen_kyc_scam(rng: random.Random) -> Row:
    bank = rng.choice(BANKS)
    amt = rng.choice([499, 999, 1499, 1999, 2499, 2999, 4999, 5999])
    upi = scam_upi(rng)
    phone = rnd_phone(rng)
    urg = rng.choice(URGENCY_PHRASES)
    cons = rng.choice(CONSEQUENCES)
    g = rng.choice(GREETINGS_FORMAL)
    use_phone = rng.random() < 0.5
    use_upi = rng.random() < 0.85 or not use_phone
    contact = f"call {fmt_phone(rng, phone)}" if use_phone else ""
    payto = f"to {upi}" if use_upi else ""
    templates = [
        f"{g} your {bank} KYC expires today. Pay {fmt_amount(rng, amt)} verification fee {urg} {payto} {cons}. {contact}",
        f"{g} Your {bank} account KYC is pending. Complete verification by paying {fmt_amount(rng, amt)} {payto} {urg} {cons}.",
        f"{bank} ALERT: KYC not updated. Send {fmt_amount(rng, amt)} {payto} {urg} to re-activate your account. {contact}",
        f"{g} Aapka {bank} KYC expire ho gaya hai. {fmt_amount(rng, amt)} {urg} {payto} bhejo {cons}. {contact}",
        f"{g} PAN-Aadhaar link pending for your {bank} account. Pay {fmt_amount(rng, amt)} processing charge {payto} {urg} {cons}.",
        f"Your {bank} debit card will be blocked {urg}. To keep it active pay {fmt_amount(rng, amt)} KYC charge {payto}. Helpline {fmt_phone(rng, phone)}",
        f"{g} Re-KYC required. Transfer {fmt_amount(rng, amt)} {payto} and share the reference {urg}. {cons}. {contact}",
        f"{bank} customer, your net banking will be suspended {urg}. Pay verification amount {fmt_amount(rng, amt)} {payto} {cons}.",
        f"KYC update ke liye {fmt_amount(rng, amt)} {payto} {urg} pay karo, {cons}. {bank} support {fmt_phone(rng, phone)}",
        f"{g} your account has been put on hold due to incomplete KYC. Pay {fmt_amount(rng, amt)} {payto} {urg} to restore access. {contact}",
        f"Final notice from {bank}: pay KYC verification fee {fmt_amount(rng, amt)} {payto} {urg} {cons}.",
        f"{g} Update your Aadhaar with {bank} by paying {fmt_amount(rng, amt)} {payto}. Link expires {urg}. {contact}",
    ]
    return _row(rng.choice(templates), "KYC_SCAM", fraud=True, payment=True, urgency=True, impersonation=True, amount=amt, upi=upi if use_upi else None, phone=phone if use_phone or "Helpline" in templates[5] else None)


def gen_refund_scam(rng: random.Random) -> Row:
    amt = rng.choice([1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000])
    upi = scam_upi(rng) if rng.random() < 0.5 else legit_upi(rng)
    phone = rnd_phone(rng)
    urg = rng.choice(URGENCY_PHRASES)
    name = rng.choice(FIRST_NAMES)
    g = rng.choice(GREETINGS_CASUAL + GREETINGS_FORMAL)
    templates = [
        f"{g} I accidentally sent {fmt_amount(rng, amt)} to your number by mistake. Please return it {urg} to {upi}.",
        f"{g} galti se {fmt_amount(rng, amt)} aapke account me chala gaya. Please {urg} wapas bhej do {upi} pe.",
        f"{g} This is {name} from {rng.choice(APPS)} support. A wrong transfer of {fmt_amount(rng, amt)} was made to you. Refund to {upi} {urg} to avoid account freeze.",
        f"Wrong transfer alert: {fmt_amount(rng, amt)} credited to you by error. Reverse the amount {urg} to {upi} or call {fmt_phone(rng, phone)}.",
        f"{g} my son sent {fmt_amount(rng, amt)} to your UPI by mistake, he is crying. Please send it back {urg} on {upi}. God bless you.",
        f"{g} {rng.choice(APPS)} refund of {fmt_amount(rng, amt)} is stuck. To release it, first pay {fmt_amount(rng, rng.choice([99, 199, 299, 499]))} verification to {upi} {urg}.",
        f"{g} order {order_id(rng)} refund failed. Pay {fmt_amount(rng, rng.choice([49, 99, 149, 199]))} reversal charge to {upi} {urg} and full refund of {fmt_amount(rng, amt)} will be credited.",
        f"{g} Bhai maine {fmt_amount(rng, amt)} galat number pe bhej diya, tumhare pe aaya hai. {urg} {upi} pe return kar do please.",
        f"{g} We detected an excess credit of {fmt_amount(rng, amt)} in your wallet. Return it {urg} to {upi} else your wallet will be blocked.",
        f"Refund team here. Your cashback of {fmt_amount(rng, amt)} is pending. Send {fmt_amount(rng, rng.choice([99, 199, 249]))} processing fee to {upi} {urg}.",
    ]
    return _row(rng.choice(templates), "REFUND_SCAM", fraud=True, payment=True, urgency=True, impersonation=rng.random() < 0.5, amount=amt, upi=upi, phone=None)


def gen_prize_scam(rng: random.Random) -> Row:
    prize = rng.choice([5000, 10000, 25000, 50000, 100000, 250000, 500000])
    fee = rng.choice([99, 199, 299, 499, 999, 1499, 1999])
    upi = scam_upi(rng)
    phone = rnd_phone(rng)
    urg = rng.choice(URGENCY_PHRASES)
    brand = rng.choice(["KBC", "Amazon", "Flipkart", "Jio", rng.choice(APPS), "Lucky Draw", "Dream11", "IPL", "Big Bazaar"])
    templates = [
        f"Congratulations! You have won {fmt_amount(rng, prize)} in the {brand} lucky draw. Pay {fmt_amount(rng, fee)} processing fee to {upi} {urg} to claim.",
        f"You have received {fmt_amount(rng, prize)} cashback from {brand}. Pay {fmt_amount(rng, fee)} activation charge to {upi} to receive it {urg}.",
        f"Badhai ho! Aapne {brand} lottery me {fmt_amount(rng, prize)} jeeta hai. Claim karne ke liye {fmt_amount(rng, fee)} {upi} pe {urg} bhejo.",
        f"Dear winner, your {brand} prize of {fmt_amount(rng, prize)} is ready. Registration fee {fmt_amount(rng, fee)} to {upi}. Call {fmt_phone(rng, phone)} {urg}.",
        f"Your number was selected for {fmt_amount(rng, prize)} reward. Send {fmt_amount(rng, fee)} GST charge to {upi} {urg}, last chance.",
        f"{brand} scratch card: you won {fmt_amount(rng, prize)}! Unlock by paying {fmt_amount(rng, fee)} to {upi} {urg}.",
        f"Lucky customer! {fmt_amount(rng, prize)} bonus credited pending. Transfer {fmt_amount(rng, fee)} to {upi} for release {urg}. Contact {fmt_phone(rng, phone)}",
        f"Gift voucher worth {fmt_amount(rng, prize)} approved for you. Pay delivery charge {fmt_amount(rng, fee)} on {upi} {urg}.",
    ]
    return _row(rng.choice(templates), "PRIZE_SCAM", fraud=True, payment=True, urgency=True, impersonation=True, amount=fee, upi=upi, phone=None)


def gen_impersonation(rng: random.Random) -> Row:
    amt = rng.choice([2000, 3000, 5000, 8000, 10000, 15000, 20000, 25000])
    upi = scam_upi(rng) if rng.random() < 0.4 else legit_upi(rng)
    phone = rnd_phone(rng)
    urg = rng.choice(URGENCY_PHRASES)
    boss = rng.choice(["your manager", "the CEO", "your HR head", "Mr. Sharma from accounts", "the director", "your team lead"])
    officer = rng.choice(["a police officer", "the cyber cell", "an income tax officer", "customs officer", "TRAI officer", "the electricity board"])
    relative = rng.choice(RELATIONS)
    templates = [
        f"Hi, this is {boss}. I am in a meeting and need {fmt_amount(rng, amt)} transferred {urg} to {upi} for a vendor. Will reimburse today.",
        f"This is {officer}. A parcel in your name contains illegal items. Pay {fmt_amount(rng, amt)} penalty {urg} to {upi} to avoid arrest.",
        f"{relative} here, new number. Phone broke. Send {fmt_amount(rng, amt)} {urg} to {upi}, emergency, will explain later.",
        f"Beta, this is your {relative.lower()}'s friend. {relative} is in hospital, send {fmt_amount(rng, amt)} {urg} to {upi} for the admission.",
        f"Hello, I'm calling from {rng.choice(BANKS)} security. Your account is compromised. Move {fmt_amount(rng, amt)} to safe account {upi} {urg}.",
        f"Your electricity connection will be cut {urg}. Pay pending bill {fmt_amount(rng, amt)} to {upi} now. Officer {fmt_phone(rng, phone)}",
        f"Main {boss} bol raha hoon. Meeting me hoon, {fmt_amount(rng, amt)} {urg} {upi} pe bhej do, vendor wait kar raha hai.",
        f"Customer care {rng.choice(APPS)}: your account shows suspicious activity. Transfer {fmt_amount(rng, amt)} to verification account {upi} {urg}.",
        f"{rng.choice(GREETINGS_FORMAL)} Your SIM will be blocked by TRAI {urg}. Pay {fmt_amount(rng, amt)} to {upi} to continue services. Call {fmt_phone(rng, phone)}",
        f"Hey it's {rng.choice(FIRST_NAMES)}, using a friend's phone. Stuck at the airport, need {fmt_amount(rng, amt)} {urg} on {upi}. Please yaar.",
    ]
    return _row(rng.choice(templates), "IMPERSONATION", fraud=True, payment=True, urgency=True, impersonation=True, amount=amt, upi=upi, phone=None)


def gen_urgency_payment(rng: random.Random) -> Row:
    amt = rng.choice([500, 1000, 1500, 2000, 3000, 5000, 7000])
    upi = scam_upi(rng) if rng.random() < 0.5 else legit_upi(rng)
    urg = rng.choice(URGENCY_PHRASES)
    cons = rng.choice(CONSEQUENCES)
    templates = [
        f"Pay {fmt_amount(rng, amt)} {urg} to {upi} {cons}. This is the last reminder.",
        f"Your subscription payment failed. Pay {fmt_amount(rng, amt)} to {upi} {urg} {cons}.",
        f"Pending due of {fmt_amount(rng, amt)} must be cleared {urg}. Send to {upi}. No further extension.",
        f"{fmt_amount(rng, amt)} {urg} {upi} pe bhejo {cons}, warna problem ho jayegi.",
        f"Loan EMI overdue. Pay {fmt_amount(rng, amt)} {urg} to {upi} {cons}. Recovery agent will visit.",
        f"Your delivery is on hold. Pay {fmt_amount(rng, amt)} customs charge to {upi} {urg} or the parcel will be returned.",
        f"Payment of {fmt_amount(rng, amt)} is required {urg}. Use UPI {upi}. Do not ignore this message.",
        f"Send {fmt_amount(rng, amt)} {urg} to {upi}. Time limit 30 minutes. {cons}.",
    ]
    return _row(rng.choice(templates), "URGENCY_PAYMENT", fraud=True, payment=True, urgency=True, impersonation=rng.random() < 0.4, amount=amt, upi=upi, phone=None)


def gen_investment_scam(rng: random.Random) -> Row:
    amt = rng.choice([500, 1000, 2000, 5000, 10000, 25000])
    ret = amt * rng.choice([2, 3, 5, 10])
    upi = scam_upi(rng)
    phone = rnd_phone(rng)
    templates = [
        f"Invest {fmt_amount(rng, amt)} today and get {fmt_amount(rng, ret)} in 7 days, guaranteed returns. Pay to {upi}. Limited slots.",
        f"Crypto trading tips group: deposit {fmt_amount(rng, amt)} to {upi} and earn daily profit of {fmt_amount(rng, ret // 10)}. 100% safe.",
        f"Double your money scheme! Send {fmt_amount(rng, amt)} to {upi} and receive {fmt_amount(rng, ret)} by Monday. WhatsApp {fmt_phone(rng, phone)}",
        f"Sirf {fmt_amount(rng, amt)} invest karo aur {fmt_amount(rng, ret)} pao guaranteed. {upi} pe payment karo abhi.",
        f"Stock market expert here. Minimum deposit {fmt_amount(rng, amt)} to {upi}. Assured {rng.choice([20, 30, 50])}% weekly return.",
        f"Forex signals: first {rng.choice([5, 10, 20])} members get {fmt_amount(rng, ret)} on {fmt_amount(rng, amt)}. Transfer to {upi} now.",
        f"Join our IPO allotment scheme. Pay {fmt_amount(rng, amt)} to {upi} and get confirmed allotment with {rng.choice([2, 3])}x listing gain.",
    ]
    return _row(rng.choice(templates), "INVESTMENT_SCAM", fraud=True, payment=True, urgency=rng.random() < 0.5, impersonation=rng.random() < 0.3, amount=amt, upi=upi, phone=None)


def gen_job_scam(rng: random.Random) -> Row:
    fee = rng.choice([199, 299, 499, 999, 1500, 2000, 2500])
    salary = rng.choice([15000, 25000, 35000, 50000, 80000])
    upi = scam_upi(rng)
    phone = rnd_phone(rng)
    company = rng.choice(["Amazon", "Flipkart", "TCS", "Infosys", "a leading MNC", "Swiggy", "Zomato", "Wipro"])
    templates = [
        f"Congratulations, you are selected for a work from home job at {company}. Salary {fmt_amount(rng, salary)}/month. Pay registration fee {fmt_amount(rng, fee)} to {upi} to confirm.",
        f"Part time job: earn {fmt_amount(rng, salary // 10)} per day by liking videos. Pay {fmt_amount(rng, fee)} security deposit to {upi} to start.",
        f"HR team {company}: your interview is cleared. Send {fmt_amount(rng, fee)} for laptop courier to {upi}. Refundable with first salary.",
        f"Ghar baithe kaam, roz {fmt_amount(rng, salary // 20)} kamao. Joining ke liye {fmt_amount(rng, fee)} {upi} pe bhejo. Call {fmt_phone(rng, phone)}",
        f"Task completed! To withdraw your earnings of {fmt_amount(rng, salary // 5)}, pay {fmt_amount(rng, fee)} unlock fee to {upi}.",
        f"Data entry job offer, no experience needed. Registration {fmt_amount(rng, fee)} only, pay on {upi}. Salary {fmt_amount(rng, salary)}.",
        f"Your resume is shortlisted at {company}. Document verification fee {fmt_amount(rng, fee)} payable to {upi} within 24 hours.",
    ]
    return _row(rng.choice(templates), "JOB_SCAM", fraud=True, payment=True, urgency=rng.random() < 0.5, impersonation=True, amount=fee, upi=upi, phone=None)


def gen_qr_scam(rng: random.Random) -> Row:
    amt = rng.choice([1000, 2000, 5000, 10000, 15000, 20000])
    phone = rnd_phone(rng)
    link = short_link(rng)
    templates = [
        f"I am interested in your listing. I will pay {fmt_amount(rng, amt)}, just scan this QR code I am sending to receive the money.",
        f"To receive your refund of {fmt_amount(rng, amt)}, scan the QR code and enter your UPI PIN. Link: {link}",
        f"Scan QR karo aur PIN dalo, {fmt_amount(rng, amt)} tumhare account me aa jayega. Jaldi karo.",
        f"Your {rng.choice(BANKS)} reward of {fmt_amount(rng, amt)} is waiting. Scan the attached QR to collect. Valid today only.",
        f"Install this app {link} and share the screen to receive {fmt_amount(rng, amt)} cashback instantly.",
        f"Buyer here from OLX. Sending a payment request of {fmt_amount(rng, amt)} on {rng.choice(APPS)}, please accept and enter PIN to receive.",
        f"Click {link} to verify your UPI and get {fmt_amount(rng, amt)} credited. Enter PIN to confirm. Support {fmt_phone(rng, phone)}",
        f"Collect request sent for {fmt_amount(rng, amt)}. Approve it with your UPI PIN to receive the amount.",
    ]
    return _row(rng.choice(templates), "QR_SCAM", fraud=True, payment=True, urgency=rng.random() < 0.6, impersonation=rng.random() < 0.5, amount=amt, upi=None, phone=None)


def gen_marketplace(rng: random.Random) -> Row:
    item = rng.choice(["iPhone 13", "study table", "Royal Enfield", "washing machine", "sofa set", "laptop", "Activa scooter", "PS5", "camera", "cycle", "fridge"])
    amt = rng.choice([1500, 2500, 4000, 6000, 8000, 12000, 18000, 25000, 40000])
    scam = rng.random() < 0.3
    if scam:
        upi = scam_upi(rng) if rng.random() < 0.5 else legit_upi(rng)
        adv = rng.choice([500, 1000, 2000, 3000])
        templates = [
            f"I am army officer posted in cantonment, cannot meet. Pay {fmt_amount(rng, adv)} advance to {upi} and my courier will deliver the {item}.",
            f"Seller here. {item} is booked for you. Send {fmt_amount(rng, adv)} token amount to {upi} today otherwise another buyer will take it.",
            f"For the {item}, pay full {fmt_amount(rng, amt)} to {upi} first, delivery within 2 days via army courier. No inspection possible.",
            f"CRPF jawan, urgent posting. {item} at {fmt_amount(rng, amt)} only. Advance {fmt_amount(rng, adv)} on {upi} to block it.",
            f"{item} available. Pay {fmt_amount(rng, adv)} delivery charge to {upi} now and the courier will bring it to your home, pay balance on delivery.",
        ]
        return _row(rng.choice(templates), "MARKETPLACE_PAYMENT", fraud=True, payment=True, urgency=True, impersonation=rng.random() < 0.6, amount=adv if "advance" in templates[0] else amt, upi=upi, phone=None, risk="HIGH")
    upi = legit_upi(rng)
    templates = [
        f"Hi, saw your OLX ad for the {item}. Can I come and check it tomorrow? If ok I will pay {fmt_amount(rng, amt)} on {rng.choice(APPS)} after seeing it.",
        f"Deal final at {fmt_amount(rng, amt)} for the {item}. I will pay when I pick it up on Sunday. My UPI is {upi} if you need to refund anything.",
        f"Thanks for the {item}! Sent {fmt_amount(rng, amt)} to {upi} just now, please check and confirm.",
        f"{item} ke liye {fmt_amount(rng, amt)} theek hai. Kal aake dekh ke pay kar dunga, cash ya UPI dono chalega.",
        f"Payment for the {item} done, {fmt_amount(rng, amt)} via {rng.choice(APPS)} to {upi}. Please share the invoice.",
        f"I can pay {fmt_amount(rng, amt)} for the {item}, pickup from your place. Share your UPI ID or I will pay cash on pickup.",
    ]
    return _row(rng.choice(templates), "MARKETPLACE_PAYMENT", fraud=False, payment=True, urgency=False, impersonation=False, amount=amt, upi=upi, phone=None, risk="LOW")


def gen_payment_request(rng: random.Random) -> Row:
    name = rng.choice(FIRST_NAMES)
    amt = rng.choice([100, 150, 200, 250, 300, 400, 500, 600, 750, 800, 1000, 1200, 1500, 2000])
    upi = legit_upi(rng, name)
    reason = rng.choice(["the cab", "yesterday's dinner", "movie tickets", "the trek booking", "Goa trip", "the gift for Priya", "the pizza", "the Uber", "cricket ground booking", "the birthday cake", "last night's drinks", "the Netflix split", "the electricity share", "the auto", "the concert tickets"])
    g = rng.choice(GREETINGS_CASUAL)
    templates = [
        f"{g} send {fmt_amount(rng, amt)} for {reason}. UPI: {upi}",
        f"{g} your share for {reason} is {fmt_amount(rng, amt)}. Pay to {upi} whenever free.",
        f"{g} {reason} ka {fmt_amount(rng, amt)} bhej dena, {upi}",
        f"{g} can you transfer {fmt_amount(rng, amt)} for {reason}? {upi} works. No rush.",
        f"{g} {fmt_amount(rng, amt)} for {reason} please, GPay on {upi}. Thanks!",
        f"{g} reminder, {fmt_amount(rng, amt)} pending for {reason}. {upi} or cash, whatever is easy.",
        f"{g} split for {reason} came to {fmt_amount(rng, amt)} each. Send to {upi} when you can.",
        f"{g} {name} here, {fmt_amount(rng, amt)} for {reason} bhej do bhai. {upi}",
        f"{g} {reason} ka {fmt_amount(rng, amt)} per head aaya hai, sabko bhejna hai {upi} pe by {rng.choice(['friday', 'kal', 'weekend', 'monday'])}",
        f"{g} send {fmt_amount(rng, amt)} for {reason} to {upi}",
        f"{g} {fmt_amount(rng, amt)} de dena {reason} ke liye, {upi}",
        f"{g} {reason} settle kar de, {fmt_amount(rng, amt)} on {upi}",
    ]
    return _row(rng.choice(templates), "PAYMENT_REQUEST", fraud=False, payment=True, urgency=False, impersonation=False, amount=amt, upi=upi, phone=None, risk="LOW")


def gen_friend_family(rng: random.Random) -> Row:
    rel = rng.choice(RELATIONS + FIRST_NAMES)
    amt = rng.choice([500, 1000, 1500, 2000, 3000, 5000, 8000, 10000, 18000])
    upi = legit_upi(rng)
    phone = rnd_phone(rng)
    urgent = rng.random() < 0.35
    templates = [
        f"Beta, send {fmt_amount(rng, amt)} to {upi} for the school fees, {rel} will pay you back next week.",
        f"{rel}, mera recharge khatam ho gaya, {fmt_amount(rng, amt)} {upi} pe bhej dena please.",
        f"Hi {rel}, transferring {fmt_amount(rng, amt)} for the groceries you got. Sending to {upi}.",
        f"Papa needs {fmt_amount(rng, amt)} for the hospital deposit today so admission can be completed. Send to {upi}, I'll transfer back on Monday.",
        f"{rel} bhai, {fmt_amount(rng, amt)} for the train tickets, {upi} pe bhej do. Thanks!",
        f"Can you send {fmt_amount(rng, amt)} to {upi}? Rent is due tomorrow and my salary is delayed. Will return by 5th.",
        f"Sent {fmt_amount(rng, amt)} for Diwali shopping to {upi}, check and tell me if received.",
        f"{rel}, {fmt_amount(rng, amt)} for Mummy's medicines. My UPI {upi} or call me {fmt_phone(rng, phone)}",
        f"Need {fmt_amount(rng, amt)} for the flight change today, please send to {upi} and I'll settle when back.",
        f"Beta {fmt_amount(rng, amt)} bhej dena papa ke dawai ke liye {upi}, kal wapas kar dungi.",
        f"{rel}, {fmt_amount(rng, amt)} chahiye college fees ke liye, {upi} pe bhej do please, agle hafte lauta dunga.",
        f"Sending {fmt_amount(rng, amt)} to {upi} for the wedding gift from all of us.",
    ]
    msg = rng.choice(templates)
    return _row(msg, "FRIEND_FAMILY_PAYMENT", fraud=False, payment=True, urgency=urgent or "today" in msg or "tomorrow" in msg, impersonation=False, amount=amt, upi=upi, phone=None, risk="LOW")


def gen_merchant(rng: random.Random) -> Row:
    merchant = rng.choice(MERCHANTS)
    amt = rng.choice([120, 180, 250, 350, 480, 650, 899, 1200, 1499, 2350, 3200, 4500])
    upi = merchant_upi(rng, merchant)
    templates = [
        f"{merchant}: your bill is {fmt_amount(rng, amt)}. Pay via UPI {upi} or at the counter. Thank you for visiting.",
        f"Invoice #{rng.randint(1000, 9999)} from {merchant} for {fmt_amount(rng, amt)}. UPI ID {upi}. Please share screenshot after payment.",
        f"Thanks for your order at {merchant}. Amount due {fmt_amount(rng, amt)}. Pay on delivery or to {upi}.",
        f"{merchant} monthly subscription of {fmt_amount(rng, amt)} is due on {rng.randint(1, 28)}th. Pay to {upi} at your convenience.",
        f"Your repair at {merchant} is complete. Total {fmt_amount(rng, amt)}. UPI: {upi}. Collect anytime before 8 pm.",
        f"{merchant} se order ready hai. {fmt_amount(rng, amt)} {upi} pe pay kar dena ya cash de dena.",
        f"Payment received, {fmt_amount(rng, amt)} from you at {merchant}. Thank you, visit again!",
        f"{merchant}: table booked. A deposit of {fmt_amount(rng, amt)} to {upi} confirms the booking, adjustable against the bill.",
        f"{merchant}: admission deposit of {fmt_amount(rng, amt * 4)} for patient {rng.choice(FIRST_NAMES)} {rng.choice('KRSMP')} is due today so the admission can be completed. Pay at the billing counter or to UPI {upi}. Receipt will be issued.",
        f"{merchant}: advance of {fmt_amount(rng, amt)} for the {rng.choice(['service', 'booking', 'order'])} is due by {rng.randint(1, 28)}th. Pay to {upi} or at the desk. GST invoice will follow.",
    ]
    return _row(rng.choice(templates), "MERCHANT_PAYMENT", fraud=False, payment=True, urgency=False, impersonation=False, amount=amt, upi=upi, phone=None, risk="LOW")


def gen_bill_payment(rng: random.Random) -> Row:
    biller = rng.choice(BILLERS)
    amt = rng.choice([299, 399, 499, 649, 799, 1050, 1340, 1890, 2460, 3120])
    due = f"{rng.randint(1, 28)} {rng.choice(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])}"
    templates = [
        f"{biller}: your bill of {fmt_amount(rng, amt)} for consumer no. {rng.randint(100000, 999999)} is due on {due}. Pay via the {biller} app or BBPS.",
        f"Your {biller} broadband plan renews on {due}. Amount {fmt_amount(rng, amt)}. Auto-pay is enabled, no action needed.",
        f"Reminder: {biller} bill {fmt_amount(rng, amt)} due {due}. Pay through {rng.choice(APPS)} bill payments section.",
        f"{biller} ka bill {fmt_amount(rng, amt)} aaya hai, {due} tak bhar dena app se.",
        f"Bill generated for {biller}: {fmt_amount(rng, amt)}. View and pay from the official app. Ignore if already paid.",
        f"Recharge reminder: your {biller} plan expires on {due}. Recharge {fmt_amount(rng, amt)} from the app to continue.",
        f"Payment of {fmt_amount(rng, amt)} received for {biller} bill. Receipt no. {rng.randint(10000000, 99999999)}.",
    ]
    return _row(rng.choice(templates), "BILL_PAYMENT", fraud=False, payment=True, urgency=False, impersonation=False, amount=amt, upi=None, phone=None, risk="LOW")


def gen_bank_request(rng: random.Random) -> Row:
    bank = rng.choice(BANKS)
    amt = rng.choice([1250, 2500, 4300, 5600, 8900, 12000, 15400, 22000])
    templates = [
        f"{bank}: EMI of {fmt_amount(rng, amt)} for loan a/c ending {rng.randint(1000, 9999)} is due on {rng.randint(1, 28)}th. Maintain sufficient balance. Do not share OTP with anyone.",
        f"{bank}: credit card statement generated. Total due {fmt_amount(rng, amt)}, minimum due {fmt_amount(rng, amt // 10)}. Pay via net banking or the {bank} app.",
        f"{bank} alert: {fmt_amount(rng, amt)} debited from a/c XX{rng.randint(1000, 9999)} for UPI txn. If not you, call the number on the back of your card.",
        f"{bank}: {fmt_amount(rng, amt)} credited to your account XX{rng.randint(1000, 9999)}. Available balance {fmt_amount(rng, amt * rng.randint(2, 9))}.",
        f"{bank}: your fixed deposit of {fmt_amount(rng, amt * 10)} matures on {rng.randint(1, 28)}th. Visit the branch or use net banking to renew.",
        f"{bank} never asks for your PIN, OTP or CVV. Report suspicious calls to 1930. Your KYC can be updated only at the branch or the official app.",
        f"{bank}: auto-debit of {fmt_amount(rng, amt)} for your SIP will be attempted on {rng.randint(1, 28)}th. Please keep sufficient balance.",
        f"{bank}: cheque no. {rng.randint(100000, 999999)} for {fmt_amount(rng, amt)} has been cleared.",
    ]
    return _row(rng.choice(templates), "BANK_REQUEST", fraud=False, payment=True, urgency=False, impersonation=False, amount=amt, upi=None, phone=None, risk="LOW")


def gen_non_payment(rng: random.Random) -> Row:
    name = rng.choice(FIRST_NAMES)
    phone = rnd_phone(rng)
    num = rng.randint(2, 60)
    templates = [
        f"Meeting moved to {rng.randint(1, 12)}:{rng.choice(['00', '30'])} tomorrow, room {rng.randint(101, 420)}.",
        f"Happy birthday {name}! Have a great year ahead.",
        f"Match starts at 7:30, bring {num} people if you want, plenty of space.",
        f"Did you finish the assignment? Question {num} was tough.",
        f"Train is delayed by {num} minutes, will reach by {rng.randint(6, 11)} pm.",
        f"Bhai kal {rng.randint(9, 11)} baje milte hain college gate pe.",
        f"My new number is {fmt_phone(rng, phone)}, save it.",
        f"Mom said dinner at 8, don't be late again.",
        f"Flight lands at {rng.randint(1, 12)}:{rng.choice(['05', '15', '40'])}, gate {rng.randint(1, 40)}.",
        f"I went to the {rng.choice(BANKS)} branch today for KYC, took {num} minutes only.",
        f"The refund for the cancelled train ticket came through, finally. IRCTC took {num} days.",
        f"Congratulations on the new job {name}! Party when?",
        f"Weather is crazy today, {num} degrees and raining.",
        f"Send me the notes for chapter {num} when you get a chance.",
        f"Reached home safely, thanks for the ride!",
        f"Reminder: dentist appointment on {rng.randint(1, 28)}th at {rng.randint(9, 17)}:00.",
        f"Kya scene hai aaj shaam? Movie chalein?",
        f"OTP for your login is {rng.randint(100000, 999999)}. Valid for 10 minutes. Do not share it with anyone.",
        f"Your Swiggy order has been delivered. Rate your experience.",
        f"Package {order_id(rng)} out for delivery, expected by {rng.randint(1, 9)} pm.",
        f"Bro the {rng.choice(['Netflix', 'Prime', 'Hotstar'])} password changed, ask {name}.",
        f"Got {num} marks in the internal, decent I guess.",
        f"{name} is joining us for lunch, table for {rng.randint(3, 8)}.",
        f"Can you pick up {num} kg of rice on the way back?",
        f"Class cancelled today, prof is on leave.",
        f"Scored a hat-trick yesterday, {num} runs too!",
        f"Landlord said the plumber will come at {rng.randint(9, 18)}:00 tomorrow.",
        f"Kal {rng.randint(5, 8)} baje gym aa raha hai kya?",
        f"Saw your story, that place looks amazing. Where is it?",
        f"Our bank branch was closed today, holiday for Ganesh Chaturthi.",
    ]
    return _row(rng.choice(templates), "NON_PAYMENT", fraud=False, payment=False, urgency=False, impersonation=False, amount=None, upi=None, phone=None, risk="LOW")


GENERATORS: dict[str, tuple[callable, float]] = {
    # intent: (generator, sampling weight)
    "KYC_SCAM": (gen_kyc_scam, 1.0),
    "REFUND_SCAM": (gen_refund_scam, 0.9),
    "PRIZE_SCAM": (gen_prize_scam, 0.9),
    "IMPERSONATION": (gen_impersonation, 0.9),
    "URGENCY_PAYMENT": (gen_urgency_payment, 0.7),
    "INVESTMENT_SCAM": (gen_investment_scam, 0.7),
    "JOB_SCAM": (gen_job_scam, 0.7),
    "QR_SCAM": (gen_qr_scam, 0.7),
    "MARKETPLACE_PAYMENT": (gen_marketplace, 0.8),
    "PAYMENT_REQUEST": (gen_payment_request, 1.0),
    "FRIEND_FAMILY_PAYMENT": (gen_friend_family, 0.9),
    "MERCHANT_PAYMENT": (gen_merchant, 0.9),
    "BILL_PAYMENT": (gen_bill_payment, 0.8),
    "BANK_REQUEST": (gen_bank_request, 0.8),
    "NON_PAYMENT": (gen_non_payment, 1.4),
}


def _noise(rng: random.Random, text: str) -> str:
    """Light, realistic noise: casing, dropped punctuation, extra spaces."""
    r = rng.random()
    if r < 0.12:
        text = text.lower()
    elif r < 0.16:
        text = text.upper()
    if rng.random() < 0.15:
        text = text.replace(".", "").replace(",", "")
    if rng.random() < 0.1:
        text = text.replace("  ", " ").replace(" ,", ",")
    return text


def generate(rows: int, seed: int) -> list[Row]:
    rng = random.Random(seed)
    names = list(GENERATORS.keys())
    weights = [GENERATORS[n][1] for n in names]
    seen: set[str] = set()
    out: list[Row] = []
    attempts = 0
    while len(out) < rows and attempts < rows * 20:
        attempts += 1
        intent = rng.choices(names, weights=weights, k=1)[0]
        row = GENERATORS[intent][0](rng)
        row["message"] = _noise(rng, str(row["message"]))
        if row["message"] in seen:
            continue
        seen.add(row["message"])
        # Fill extracted-entity columns from the real extractor so labels and
        # extraction stay consistent (and the extractor gets exercised at scale).
        ents = extract_entities(str(row["message"]))
        row["phone_number"] = ents.phone_number
        row["upi_id"] = ents.upi_id
        row["amount"] = ents.primary_amount
        row["suspicious_keywords"] = "|".join(ents.keywords)
        out.append(row)
    rng.shuffle(out)
    return out


FIELDS = ["message", "intent", "is_payment_related", "is_fraud", "risk_label", "phone_number", "upi_id", "amount", "urgency", "impersonation", "suspicious_keywords"]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rows", type=int, default=4000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", type=Path, default=BACKEND_DIR / "data" / "payment_messages.csv")
    args = parser.parse_args()

    data = generate(args.rows, args.seed)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDS)
        writer.writeheader()
        for row in data:
            writer.writerow({k: row.get(k) for k in FIELDS})

    by_intent: dict[str, int] = {}
    fraud = 0
    for row in data:
        by_intent[str(row["intent"])] = by_intent.get(str(row["intent"]), 0) + 1
        fraud += int(bool(row["is_fraud"]))
    print(f"wrote {len(data)} rows to {args.out}")
    print(f"fraud={fraud} legit={len(data) - fraud}")
    for intent, count in sorted(by_intent.items(), key=lambda kv: -kv[1]):
        print(f"  {intent:<24}{count}")


if __name__ == "__main__":
    main()
