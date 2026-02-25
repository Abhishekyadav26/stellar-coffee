"use client";

// components/BuyCoffeeContract.tsx
// Full integration with By Me Coffee Soroban contract
// Contract: CAYRJABAYNE4Q5PYYILXIUZOWKCHJGMURXXWAD7MXGFHGRRSUG5CCIKF

import { useState, useEffect, useCallback } from "react";
import {
  buildBuyCoffeeTransaction,
  submitCoffeeTransaction,
  getTipHistory,
  getLeaderboard,
  getTotalDonated,
  TipRecord,
  LeaderboardEntry,
} from "@/lib/coffee-contract";

// ─── Freighter type shim ──────────────────────────────────────────────────────
type FreighterAPI = {
  isConnected: () => Promise<boolean>;
  getPublicKey: () => Promise<string>;
  signTransaction: (
    xdr: string,
    opts: { network: string; networkPassphrase: string }
  ) => Promise<string>;
};

function getFreighter(): FreighterAPI | null {
  return (
    (window as unknown as { freighter?: FreighterAPI }).freighter ?? null
  );
}

// ─── Preset coffee amounts ────────────────────────────────────────────────────
const COFFEE_PRESETS = [
  { label: "☕ Espresso", xlm: "1", desc: "1 XLM" },
  { label: "☕☕ Latte", xlm: "3", desc: "3 XLM" },
  { label: "☕☕☕ Cold Brew", xlm: "5", desc: "5 XLM" },
  { label: "🫘 Bag of Beans", xlm: "10", desc: "10 XLM" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ShortenAddr({ addr }: { addr: string }) {
  return (
    <span className="font-mono text-xs">
      {addr.slice(0, 6)}…{addr.slice(-6)}
    </span>
  );
}

function CoffeeRing({ size = 48, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={animated ? "animate-spin-slow" : ""}
    >
      <circle
        cx="24" cy="24" r="20"
        fill="none"
        stroke="#c8956c"
        strokeWidth="2.5"
        strokeDasharray="6 4"
        opacity="0.4"
      />
      <text x="24" y="30" textAnchor="middle" fontSize="22">☕</text>
    </svg>
  );
}

// ─── Buy Coffee Form ──────────────────────────────────────────────────────────

function BuyCoffeeForm({
  address,
  onSuccess,
}: {
  address: string;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("3");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"idle" | "building" | "signing" | "submitting" | "polling">("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function handleBuy() {
    setError(null);
    setTxHash(null);
    const freighter = getFreighter();
    if (!freighter) {
      setError("Freighter wallet not found.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    try {
      setStep("building");
      const xdr = await buildBuyCoffeeTransaction(address, amount, message || "☕");

      setStep("signing");
      const signedXDR = await freighter.signTransaction(xdr, {
        network: "TESTNET",
        networkPassphrase: "Test SDF Network ; September 2015",
      });

      setStep("submitting");
      const result = await submitCoffeeTransaction(signedXDR);

      if (!result.success) throw new Error(result.error ?? "Transaction failed");

      setTxHash(result.hash ?? null);
      setMessage("");
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setStep("idle");
    }
  }

  const isLoading = step !== "idle";

  return (
    <div className="space-y-5">
      {/* Preset Amounts */}
      <div>
        <label className="block text-xs font-semibold text-amber-700 uppercase tracking-widest mb-2">
          Choose your coffee
        </label>
        <div className="grid grid-cols-2 gap-2">
          {COFFEE_PRESETS.map((p) => (
            <button
              key={p.xlm}
              onClick={() => setAmount(p.xlm)}
              className={`rounded-xl px-3 py-2.5 text-sm font-medium border-2 transition-all duration-150 ${
                amount === p.xlm
                  ? "border-amber-500 bg-amber-50 text-amber-800 shadow-sm"
                  : "border-amber-100 bg-white text-amber-700 hover:border-amber-300"
              }`}
            >
              <span className="block">{p.label}</span>
              <span className="block text-xs text-amber-500">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div>
        <label className="block text-xs font-semibold text-amber-700 uppercase tracking-widest mb-1">
          Custom Amount (XLM)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.1"
          step="0.1"
          className="w-full rounded-xl border-2 border-amber-100 bg-amber-50/50 px-4 py-2.5 text-amber-900 text-sm font-mono focus:outline-none focus:border-amber-400 transition"
          placeholder="Enter XLM amount"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-semibold text-amber-700 uppercase tracking-widest mb-1">
          Leave a message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={100}
          rows={2}
          className="w-full rounded-xl border-2 border-amber-100 bg-amber-50/50 px-4 py-2.5 text-amber-900 text-sm focus:outline-none focus:border-amber-400 transition resize-none"
          placeholder="Thanks for the great work! ☕"
        />
        <p className="text-right text-xs text-amber-400 mt-0.5">{message.length}/100</p>
      </div>

      {/* Submit */}
      <button
        onClick={handleBuy}
        disabled={isLoading}
        className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3.5 text-sm tracking-wide transition-all duration-150 shadow-md shadow-amber-200 active:scale-[0.98]"
      >
        {step === "building" && "⚙️  Building transaction…"}
        {step === "signing" && "✍️  Sign in Freighter…"}
        {step === "submitting" && "🚀  Submitting to Stellar…"}
        {step === "polling" && "⏳  Confirming on-chain…"}
        {step === "idle" && `☕  Buy ${amount || "?"} XLM Coffee`}
      </button>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {txHash && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-3 space-y-1">
          <p className="text-sm font-semibold text-green-700">☕ Coffee sent! Thank you!</p>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-green-600 underline break-all"
          >
            View on Stellar Expert →
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Tip History Tab ──────────────────────────────────────────────────────────

function TipHistoryTab({ address }: { address: string }) {
  const [tips, setTips] = useState<TipRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getTipHistory(address);
      setTips(data);
      setLoading(false);
    })();
  }, [address]);

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-amber-50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (tips.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-4xl mb-2">🫙</p>
        <p className="text-amber-500 text-sm">No tips yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      {tips.map((tip, i) => (
        <div
          key={i}
          className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 flex gap-3 items-start"
        >
          <span className="text-xl mt-0.5">☕</span>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <ShortenAddr addr={tip.from} />
              <span className="text-amber-700 font-bold font-mono text-sm">
                +{tip.amount} XLM
              </span>
            </div>
            {tip.message && (
              <p className="text-xs text-amber-600 mt-0.5 truncate italic">
                &ldquo;{tip.message}&rdquo;
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────────────

function LeaderboardTab({ address }: { address: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getLeaderboard(address);
      setEntries(data);
      setLoading(false);
    })();
  }, [address]);

  const medals = ["🥇", "🥈", "🥉"];

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-amber-50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-4xl mb-2">🏆</p>
        <p className="text-amber-500 text-sm">Leaderboard is empty. Claim #1!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      {entries.map((entry, i) => (
        <div
          key={i}
          className={`rounded-xl px-4 py-3 flex items-center gap-3 border ${
            i === 0
              ? "bg-amber-50 border-amber-300"
              : "bg-white border-amber-100"
          }`}
        >
          <span className="text-xl">{medals[i] ?? `#${i + 1}`}</span>
          <div className="flex-1 min-w-0">
            <ShortenAddr addr={entry.address} />
            {entry.address === address && (
              <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-medium">
                You
              </span>
            )}
          </div>
          <span className="font-bold font-mono text-amber-700 text-sm">
            {entry.totalDonated} XLM
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── My Stats Tab ─────────────────────────────────────────────────────────────

function MyStatsTab({ address }: { address: string }) {
  const [total, setTotal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getTotalDonated(address);
      setTotal(data);
      setLoading(false);
    })();
  }, [address]);

  return (
    <div className="py-6 text-center space-y-4">
      <div>
        <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-1">
          Your Total Donated
        </p>
        {loading ? (
          <div className="h-10 w-32 mx-auto bg-amber-100 rounded-xl animate-pulse" />
        ) : (
          <p className="text-4xl font-bold text-amber-800 font-mono">
            {total} <span className="text-2xl font-normal text-amber-500">XLM</span>
          </p>
        )}
      </div>
      <p className="text-xs text-amber-400">
        Tracked on-chain via Soroban contract
      </p>
      <div className="inline-block bg-amber-50 border border-amber-100 rounded-xl px-4 py-2">
        <p className="text-xs text-amber-600">Contract Address</p>
        <a
          href={`https://stellar.expert/explorer/testnet/contract/CAYRJABAYNE4Q5PYYILXIUZOWKCHJGMURXXWAD7MXGFHGRRSUG5CCIKF`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-amber-500 underline"
        >
          CAYRJAB…CCIKF ↗
        </a>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "buy" | "history" | "leaderboard" | "stats";

interface Props {
  address: string;
}

export default function BuyCoffeeContract({ address }: Props) {
  const [tab, setTab] = useState<Tab>("buy");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "buy", label: "☕ Buy Coffee" },
    { id: "history", label: "📜 History" },
    { id: "leaderboard", label: "🏆 Board" },
    { id: "stats", label: "📊 My Stats" },
  ];

  return (
    <div className="rounded-3xl overflow-hidden shadow-xl border border-amber-100">
      {/* Header */}
      <div
        className="relative px-6 pt-8 pb-6"
        style={{
          background:
            "linear-gradient(135deg, #7c4a1b 0%, #b5651d 50%, #d4843a 100%)",
        }}
      >
        {/* Decorative steam */}
        <div className="absolute top-4 right-6 opacity-20 select-none pointer-events-none">
          <CoffeeRing size={80} />
        </div>
        <p className="text-amber-200 text-xs font-semibold uppercase tracking-widest mb-1">
          Soroban Smart Contract
        </p>
        <h2 className="text-white text-2xl font-bold">By Me a Coffee ☕</h2>
        <p className="text-amber-200 text-sm mt-1">
          Support creators on-chain · Stellar Testnet
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-amber-50 border-b border-amber-100">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 text-xs font-semibold py-3 px-1 transition-all ${
              tab === t.id
                ? "text-amber-800 border-b-2 border-amber-500 bg-white"
                : "text-amber-500 hover:text-amber-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white px-6 py-5">
        {tab === "buy" && (
          <BuyCoffeeForm address={address} onSuccess={refresh} />
        )}
        {tab === "history" && (
          <TipHistoryTab key={refreshKey} address={address} />
        )}
        {tab === "leaderboard" && (
          <LeaderboardTab key={refreshKey} address={address} />
        )}
        {tab === "stats" && (
          <MyStatsTab key={refreshKey} address={address} />
        )}
      </div>

      {/* Footer */}
      <div className="bg-amber-50 px-6 py-3 flex items-center justify-between border-t border-amber-100">
        <p className="text-xs text-amber-400 font-mono">CAYRJAB…CCIKF</p>
        <a
          href="https://lab.stellar.org/r/testnet/contract/CAYRJABAYNE4Q5PYYILXIUZOWKCHJGMURXXWAD7MXGFHGRRSUG5CCIKF"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-amber-500 hover:text-amber-700 underline"
        >
          View on Stellar Lab →
        </a>
      </div>
    </div>
  );
}