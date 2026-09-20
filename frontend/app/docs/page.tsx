export const metadata = {
  title: "API Reference | PausePay",
  description: "Integrate PausePay into your payment authorization flow.",
};

export default function DocsPage() {
  return (
    <article className="prose prose-zinc dark:prose-invert max-w-none">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
          API Reference
        </h1>
        <p className="text-lg text-zinc-600 dark:text-white/60 leading-relaxed max-w-3xl">
          Integrate PausePay into your payment authorization flow. The API is designed to be called synchronously before a payment is committed.
        </p>
      </header>

      <div className="space-y-16">
        {/* Evaluate Transaction */}
        <section id="evaluate" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-2.5 py-1 text-xs font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded">
              POST
            </span>
            <code className="text-sm font-mono text-zinc-800 dark:text-white/80">
              https://api.pausepay.io/v1/risk/evaluate
            </code>
          </div>
          
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
            Evaluate Transaction
          </h2>
          <p className="text-zinc-600 dark:text-white/70 mb-8 leading-relaxed">
            Evaluates a pending transaction against the PausePay Risk Engine. Send all available context, including the recipient identifier and any relevant communication history.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
            {/* Parameters */}
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 border-b border-zinc-200 dark:border-white/10 pb-2">
                Request Body Schema
              </h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4 font-mono text-sm text-zinc-800 dark:text-white/80 font-semibold">
                    amount <span className="text-red-500">*</span>
                  </div>
                  <div className="md:col-span-8 text-sm text-zinc-600 dark:text-white/60">
                    <span className="inline-block bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-white/40 text-xs px-2 py-0.5 rounded mr-2 mb-1">
                      number
                    </span>
                    The transaction amount in the smallest currency unit.
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-t border-zinc-100 dark:border-white/5 pt-6">
                  <div className="md:col-span-4 font-mono text-sm text-zinc-800 dark:text-white/80 font-semibold">
                    currency <span className="text-red-500">*</span>
                  </div>
                  <div className="md:col-span-8 text-sm text-zinc-600 dark:text-white/60">
                    <span className="inline-block bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-white/40 text-xs px-2 py-0.5 rounded mr-2 mb-1">
                      string
                    </span>
                    3-letter ISO currency code (e.g., <code className="text-zinc-800 dark:text-white/80 bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded">INR</code>).
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-t border-zinc-100 dark:border-white/5 pt-6">
                  <div className="md:col-span-4 font-mono text-sm text-zinc-800 dark:text-white/80 font-semibold">
                    payee <span className="text-red-500">*</span>
                  </div>
                  <div className="md:col-span-8 text-sm text-zinc-600 dark:text-white/60">
                    <span className="inline-block bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-white/40 text-xs px-2 py-0.5 rounded mr-2 mb-1">
                      object
                    </span>
                    Information about the recipient, including <code className="text-zinc-800 dark:text-white/80 bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded">name</code> and <code className="text-zinc-800 dark:text-white/80 bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded">vpa</code>.
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-t border-zinc-100 dark:border-white/5 pt-6">
                  <div className="md:col-span-4 font-mono text-sm text-zinc-800 dark:text-white/80 font-semibold">
                    context.message
                  </div>
                  <div className="md:col-span-8 text-sm text-zinc-600 dark:text-white/60">
                    <span className="inline-block bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-white/40 text-xs px-2 py-0.5 rounded mr-2 mb-1">
                      string
                    </span>
                    Crucial surrounding context to drastically improve risk detection accuracy.
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-t border-zinc-100 dark:border-white/5 pt-6">
                  <div className="md:col-span-4 font-mono text-sm text-zinc-800 dark:text-white/80 font-semibold">
                    context.message_timestamp
                  </div>
                  <div className="md:col-span-8 text-sm text-zinc-600 dark:text-white/60">
                    <span className="inline-block bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-white/40 text-xs px-2 py-0.5 rounded mr-2 mb-1">
                      string
                    </span>
                    ISO 8601 timestamp of the communication.
                  </div>
                </div>
              </div>
            </div>

            {/* Code Examples */}
            <div className="space-y-8">
              <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#101114] overflow-hidden shadow-sm">
                <div className="flex items-center px-4 py-3 border-b border-zinc-200 dark:border-white/5 bg-zinc-100 dark:bg-white/[0.02]">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-white/40 uppercase tracking-wider">
                    Example Request
                  </span>
                </div>
                <div className="p-4 font-mono text-sm leading-relaxed overflow-x-auto text-zinc-800 dark:text-white/80">
<pre>
<span className="text-blue-600 dark:text-blue-300">curl</span> -X POST https://api.pausepay.io/v1/risk/evaluate \{"\n"}
  -H <span className="text-emerald-600 dark:text-emerald-300">"Authorization: Bearer pp_test_8A2..."</span> \{"\n"}
  -H <span className="text-emerald-600 dark:text-emerald-300">"Content-Type: application/json"</span> \{"\n"}
  -d <span className="text-orange-600 dark:text-orange-300">'{'{'}</span>{"\n"}
  <span className="text-blue-600 dark:text-blue-300">"amount"</span>: <span className="text-purple-600 dark:text-purple-400">5000</span>,{"\n"}
  <span className="text-blue-600 dark:text-blue-300">"currency"</span>: <span className="text-emerald-600 dark:text-emerald-300">"INR"</span>,{"\n"}
  <span className="text-blue-600 dark:text-blue-300">"payee"</span>: {'{'}{"\n"}
    <span className="text-blue-600 dark:text-blue-300">"name"</span>: <span className="text-emerald-600 dark:text-emerald-300">"Rahul Sharma"</span>,{"\n"}
    <span className="text-blue-600 dark:text-blue-300">"vpa"</span>: <span className="text-emerald-600 dark:text-emerald-300">"rahul@upi"</span>{"\n"}
  {'}'},{"\n"}
  <span className="text-blue-600 dark:text-blue-300">"context"</span>: {'{'}{"\n"}
    <span className="text-blue-600 dark:text-blue-300">"message"</span>: <span className="text-emerald-600 dark:text-emerald-300">"I accidentally sent ₹5000. Please send it back."</span>,{"\n"}
    <span className="text-blue-600 dark:text-blue-300">"message_timestamp"</span>: <span className="text-emerald-600 dark:text-emerald-300">"2026-09-19T09:40:12Z"</span>{"\n"}
  {'}'}{"\n"}
<span className="text-orange-600 dark:text-orange-300">{'}'}'</span>{"\n"}
</pre>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#101114] overflow-hidden shadow-sm">
                <div className="flex items-center px-4 py-3 border-b border-zinc-200 dark:border-white/5 bg-zinc-100 dark:bg-white/[0.02]">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-white/40 uppercase tracking-wider">
                    Example Response
                  </span>
                </div>
                <div className="p-4 font-mono text-sm leading-relaxed overflow-x-auto text-zinc-800 dark:text-white/80">
<pre>
{'{'}{"\n"}
  <span className="text-blue-600 dark:text-blue-300">"risk_score"</span>: <span className="text-purple-600 dark:text-purple-400">86</span>,{"\n"}
  <span className="text-blue-600 dark:text-blue-300">"risk_band"</span>: <span className="text-emerald-600 dark:text-emerald-300">"HIGH"</span>,{"\n"}
  <span className="text-blue-600 dark:text-blue-300">"action"</span>: <span className="text-emerald-600 dark:text-emerald-300">"WARN"</span>,{"\n"}
  <span className="text-blue-600 dark:text-blue-300">"evidence"</span>: [{"\n"}
    <span className="text-emerald-600 dark:text-emerald-300">"No matching incoming credit found"</span>,{"\n"}
    <span className="text-emerald-600 dark:text-emerald-300">"First payment to recipient"</span>,{"\n"}
    <span className="text-emerald-600 dark:text-emerald-300">"Payment closely followed message"</span>,{"\n"}
    <span className="text-emerald-600 dark:text-emerald-300">"Amount matches requested amount"</span>{"\n"}
  ]{"\n"}
{'}'}{"\n"}
</pre>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Scoring */}
        <section id="scoring" className="scroll-mt-24 pt-8 border-t border-zinc-200 dark:border-white/10">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
            Deterministic Scoring Formula
          </h2>
          
          <div className="prose prose-zinc dark:prose-invert mb-6">
            <p className="text-zinc-700 dark:text-white/80 text-base">
              The Risk Engine is fully explainable. The score is a bounded sum of integer-weighted signals and mitigators. There is no black-box ML scoring—models only provide intent classification as inputs.
            </p>
          </div>
          
          <div className="bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 p-6 rounded-xl font-mono text-sm leading-relaxed overflow-x-auto shadow-sm">
            <code className="text-zinc-800 dark:text-white block">
              <span className="text-blue-600 dark:text-blue-400 font-bold">raw_score</span> = <span className="text-emerald-600 dark:text-emerald-400">∑(signal_weights)</span> + <span className="text-emerald-600 dark:text-emerald-400">∑(mitigator_weights)</span><br/><br/>
              <span className="text-blue-600 dark:text-blue-400 font-bold">final_score</span> = <span className="text-orange-600 dark:text-orange-400 font-bold">max</span>(0, <span className="text-orange-600 dark:text-orange-400 font-bold">min</span>(100, raw_score))<br/><br/>
              <span className="text-blue-600 dark:text-blue-400 font-bold">risk_band</span> = <br/>
              &nbsp;&nbsp;<span className="text-emerald-600 dark:text-emerald-400">LOW</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if final_score ≤ 34<br/>
              &nbsp;&nbsp;<span className="text-yellow-600 dark:text-yellow-400">MEDIUM</span> &nbsp;&nbsp;if final_score ≤ 64<br/>
              &nbsp;&nbsp;<span className="text-red-600 dark:text-red-400">HIGH</span> &nbsp;&nbsp;&nbsp;&nbsp;if final_score ≥ 65
            </code>
          </div>
        </section>
      </div>
    </article>
  );
}
