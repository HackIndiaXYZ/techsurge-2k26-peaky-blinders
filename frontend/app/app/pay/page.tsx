"use client";

import { ArrowLeft, Check, ShieldCheck, TriangleAlert, WifiOff, X, User, BarChart2, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PausePayWarningPage } from "@/components/payment/PausePayWarningPage";
import { ApiUnavailableError, errorMessage, recordPaymentDecision, reportFraud, verifyPayee, analyzeMessage } from "@/lib/api";
import type { VerifyPayeeResponse } from "@/lib/types";
import { displayIdentifier, formatInr } from "@/lib/utils";

type Step = "pay" | "checking" | "cancelled" | "continued" | "paid";

const scenarios = [
  { label: "Rahul · ₹5,000", to: "rahul@upi", amount: "5000", name: "Rahul Sharma", message: "I accidentally sent ₹5,000. Please return it to rahul@upi." },
  { label: "Fake refund · ₹2,499", to: "refund.claim@ybl", amount: "2499", name: "Amit Kumar", message: "Your refund of ₹2,499 is pending. Send ₹2,499 to verify." },
  { label: "Urgent request · ₹8,000", to: "emergency@upi", amount: "8000", name: "New Payee", message: "Emergency! Send ₹8,000 immediately." },
  { label: "Subscription · ₹1,200", to: "netflix@okhdfcbank", amount: "1200", name: "Known Merchant" },
];

const UPI_RE = /^[a-z0-9][a-z0-9._-]{1,63}@[a-z][a-z0-9]{1,31}$/i;
const PHONE_RE = /^(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/;

function looksValid(value: string): boolean {
  const v = value.trim();
  return UPI_RE.test(v) || PHONE_RE.test(v);
}

function PayFlow() {
  const params = useSearchParams();
  const router = useRouter();
  
  const [step, setStep] = useState<Step>("pay");
  const [to, setTo] = useState(params.get("to") ?? "");
  const [name, setName] = useState(params.get("name") ?? "");
  const [amount, setAmount] = useState(params.get("amount") ?? "");
  
  const [verification, setVerification] = useState<VerifyPayeeResponse | null>(null);
  const [warningOpen, setWarningOpen] = useState(false);
  const [busy, setBusy] = useState<"report" | "continue" | "pay" | null>(null);
  const [error, setError] = useState<{ message: string; unavailable: boolean } | null>(null);
  
  const [checkProgress, setCheckProgress] = useState(0);

  const amountNumber = Number(amount);
  const amountValid = Number.isFinite(amountNumber) && amountNumber > 0 && amountNumber <= 10_000_000 && to.trim().length > 0;

  function reset() {
    setStep("pay");
    setTo("");
    setName("");
    setAmount("");
    setVerification(null);
    setError(null);
    setWarningOpen(false);
  }

  async function verify() {
    if (!amountValid) return;
    setStep("checking");
    setError(null);
    setCheckProgress(1);
    
    try {
      // Find if this matches a scenario with a message
      const activeScenario = scenarios.find(s => s.to === to.trim());
      if (activeScenario && activeScenario.message) {
        try {
          await analyzeMessage({ message: activeScenario.message, source: "MESSENGER_SIM", source_ref: "pay-sim", sender_label: activeScenario.name });
        } catch {
          // non-critical message analysis
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 600));
      setCheckProgress(2);

      const result = await verifyPayee({ identifier: to.trim(), amount: amountNumber, payee_name: name.trim() || undefined });
      
      await new Promise((resolve) => setTimeout(resolve, 600));
      setCheckProgress(3);

      await new Promise((resolve) => setTimeout(resolve, 400));
      setVerification(result);
      if (result.decision !== "ALLOW") {
        setWarningOpen(true);
        setStep("pay"); // return to pay state underneath the warning
      } else {
        await payWithResult(result);
      }
    } catch (err) {
      setError({ message: errorMessage(err), unavailable: err instanceof ApiUnavailableError });
      setStep("pay");
    }
  }

  async function payWithResult(res: VerifyPayeeResponse) {
    setBusy("pay");
    try {
      await recordPaymentDecision(res.verification_id, "PAID");
      setStep("paid");
    } catch (err) {
      setError({ message: errorMessage(err), unavailable: err instanceof ApiUnavailableError });
      setStep("pay");
    } finally {
      setBusy(null);
    }
  }

  async function cancelAndReport() {
    if (!verification) return;
    setBusy("report");
    try {
      await reportFraud({ identifier: verification.identifier, verification_id: verification.verification_id, amount: verification.amount, reason: verification.summary });
      setWarningOpen(false);
      setStep("cancelled");
    } catch (err) {
      setError({ message: errorMessage(err), unavailable: err instanceof ApiUnavailableError });
    } finally {
      setBusy(null);
    }
  }

  async function continueAnyway() {
    if (!verification) return;
    setBusy("continue");
    try {
      await recordPaymentDecision(verification.verification_id, "CONTINUED_AFTER_WARNING");
      setWarningOpen(false);
      setStep("continued");
    } catch (err) {
      setError({ message: errorMessage(err), unavailable: err instanceof ApiUnavailableError });
    } finally {
      setBusy(null);
    }
  }

  const errorBlock = error && (
    <p className="notice notice--risk" role="alert" style={{ marginBlockStart: "var(--space-md)" }}>
      <WifiOff size={16} aria-hidden="true" />
      <span>
        {error.message}
        {error.unavailable && " The payment was not sent."}
      </span>
    </p>
  );

  if (step === "checking") {
    return (
      <main className="flex flex-col h-full bg-[#fcfdff] text-zinc-900 items-center px-5 pt-20">
        
        {/* Logo and Rings */}
        <div className="relative w-48 h-48 flex items-center justify-center mb-10">
          <div className="absolute inset-0 rounded-full bg-blue-600/5 animate-[ping_3s_ease-out_infinite]" />
          <div className="absolute inset-6 rounded-full bg-blue-600/10 animate-[ping_3s_ease-out_infinite_400ms]" />
          <div className="absolute inset-12 rounded-full bg-blue-600/15" />
          
          <div className="relative z-10 text-blue-600 shadow-[0_4px_24px_-8px_rgba(37,99,235,0.4)] rounded-2xl bg-white p-3">
             <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
               <path d="M12 12C12 8.68629 14.6863 6 18 6H30C36.6274 6 42 11.3726 42 18C42 24.6274 36.6274 30 30 30H24V18H18V30H12V12Z" fill="currentColor"/>
               <path d="M12 30V42C12 45.3137 14.6863 48 18 48H24V30H12Z" fill="currentColor"/>
             </svg>
          </div>
        </div>

        <h2 className="text-[26px] font-bold tracking-tight text-zinc-900 mb-3">Checking this payment</h2>
        <p className="text-zinc-500 text-[15px] font-medium text-center max-w-[280px] mb-12 leading-snug">
          Looking at the recipient, amount, and your payment pattern.
        </p>
        
        <div className="w-full space-y-4">
          
          {/* Card 1 */}
          <div className="border border-zinc-200/80 rounded-2xl p-4 flex gap-4 items-center bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <User size={24} className="text-blue-600" fill="currentColor" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-bold text-zinc-900 mb-2">Recipient familiarity</div>
              <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" style={{ width: checkProgress >= 1 ? '100%' : '15%' }} />
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="border border-zinc-200/80 rounded-2xl p-4 flex gap-4 items-center bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <BarChart2 size={24} className="text-blue-600" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-bold text-zinc-900 mb-2">Amount pattern</div>
              <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" style={{ width: checkProgress >= 2 ? '100%' : '20%' }} />
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="border border-zinc-200/80 rounded-2xl p-4 flex gap-4 items-center bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <FileText size={24} className="text-blue-600" fill="currentColor" strokeWidth={1} />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-bold text-zinc-900 mb-2">Payment context</div>
              <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" style={{ width: checkProgress >= 3 ? '100%' : '5%' }} />
              </div>
            </div>
          </div>

        </div>

        <div className="mt-auto pb-8 text-center flex flex-col items-center">
          <p className="text-[15px] text-zinc-500 font-medium mb-6">This usually takes a moment.</p>
          <button type="button" onClick={() => reset()} className="text-[15px] font-bold text-blue-600 mb-8 active:opacity-70 transition-opacity">
            Cancel
          </button>
          <div className="text-[11px] text-zinc-400 font-medium">
            PausePay concept &bull; Demo only
          </div>
        </div>
      </main>
    );
  }

  if (step === "paid" || step === "continued" || step === "cancelled") {
    const cancelled = step === "cancelled";
    const continued = step === "continued";
    return (
      <main className="flex flex-col h-full bg-[#f8f9fa] text-zinc-900 p-6 pt-12 items-center text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-sm border ${cancelled ? "bg-red-50 text-red-600 border-red-100" : continued ? "bg-white text-zinc-900 border-zinc-200" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
          {cancelled ? <X size={32} /> : continued ? <TriangleAlert size={28} /> : <Check size={32} strokeWidth={3} />}
        </div>
        <h2 className="text-2xl font-bold mb-3">{cancelled ? "Payment cancelled" : continued ? "You chose to continue" : "Payment successful"}</h2>
        <p className="text-sm text-zinc-500 mb-10 leading-relaxed max-w-[280px]">
          {cancelled ? "No money was sent. This identifier has been reported." : 
           continued ? "PausePay's warning was recorded. The simulated payment proceeded." : 
           "The synthetic payment was sent securely."}
        </p>
        
        <div className="mt-auto w-full space-y-3">
          <button type="button" className="w-full bg-white text-zinc-900 font-bold py-3.5 rounded-xl border border-zinc-200 shadow-sm active:bg-zinc-50 transition-colors" onClick={() => router.push("/app/messages")}>
            Start over
          </button>
          <Link href="/app/activity" className="block w-full bg-transparent text-indigo-600 font-semibold py-3.5 rounded-xl active:bg-indigo-50/50 transition-colors">
            View activity
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="flex flex-col h-full bg-[#f8f9fa] text-zinc-900 overflow-y-auto">
        <div className="px-5 pt-14 pb-2 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm border border-zinc-200">
            <ArrowLeft size={20} className="text-zinc-700" />
          </button>
          <div className="font-bold text-lg tracking-tight">FLOW</div>
          <div className="w-10 h-10" />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="flex-1 flex flex-col px-6 pt-6">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-xl font-bold text-zinc-700 shadow-sm border border-zinc-200 mb-4">
              {name ? name.slice(0, 2).toUpperCase() : <User size={24} className="text-zinc-400" />}
            </div>
            <h2 className="text-xl font-bold text-zinc-900">{name || "Unknown Payee"}</h2>
            <div className="text-sm font-medium text-zinc-500 mt-1">{to || "UPI ID required"}</div>
          </div>

          <div className="flex flex-col items-center justify-center flex-1">
            <span className="text-sm font-semibold text-zinc-500 mb-2">Paying</span>
            <div className="relative flex items-center justify-center w-full max-w-[200px]">
              <span className="absolute left-0 text-3xl font-light text-zinc-400 select-none">₹</span>
              <input
                className="w-full text-5xl font-light text-center bg-transparent outline-none text-zinc-900 placeholder:text-zinc-300"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="0"
                inputMode="numeric"
                autoFocus
              />
            </div>
          </div>

          <div className="mt-auto pb-6 pt-10">
            {errorBlock}
            
            <div className="flex items-center justify-center gap-1.5 mb-4 text-xs font-semibold text-indigo-600">
              <ShieldCheck size={14} />
              Protected by PausePay
            </div>
            
            <button 
              type="submit" 
              disabled={!amountValid}
              className="w-full bg-zinc-900 text-white font-bold py-4 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              Review payment
            </button>
          </div>
        </form>
      </main>

      <PausePayWarningPage
        open={warningOpen}
        verification={verification}
        busy={busy === "pay" ? null : busy}
        onGoBack={cancelAndReport}
        onDismiss={() => setWarningOpen(false)}
        onContinue={continueAnyway}
      />
    </>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <main className="app-content">
          <p className="empty">Loading…</p>
        </main>
      }
    >
      <PayFlow />
    </Suspense>
  );
}
