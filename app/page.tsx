"use client";

// app/page.tsx — Updated to include BuyCoffeeContract integration

import { useState } from "react";
import WalletConnection from "@/components/WalletConnection";
import BalanceDisplay from "@/components/BalanceDisplay";
import PaymentForm from "@/components/PaymentForm";
import TransactionHistory from "@/components/TransactionHistory";
import BuyCoffeeContract from "@/components/BuyCoffeeContract";

export default function Home() {
  const [address, setAddress] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [activeSection, setActiveSection] = useState<"payments" | "coffee">("coffee");

  function handlePaymentSuccess() {
    setRefreshCount((c) => c + 1);
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        {/* Header */}
        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-bold text-gray-900">
            Stellar Testnet dApp
          </h1>
          <p className="text-gray-500 text-sm">
            Freighter Wallet · Stellar Testnet · Soroban Contracts
          </p>
          <span className="inline-block text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
            🧪 Testnet Only
          </span>
        </div>

        {/* Wallet */}
        <WalletConnection
          address={address}
          onConnect={setAddress}
          onDisconnect={() => setAddress(null)}
        />

        {address && (
          <>
            <BalanceDisplay address={address} refreshTrigger={refreshCount} />

            {/* Section Switcher */}
            <div className="flex rounded-xl overflow-hidden border border-amber-200 bg-amber-50">
              <button
                onClick={() => setActiveSection("coffee")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
                  activeSection === "coffee"
                    ? "bg-amber-500 text-white"
                    : "text-amber-600 hover:bg-amber-100"
                }`}
              >
                ☕ By Me a Coffee Contract
              </button>
              <button
                onClick={() => setActiveSection("payments")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
                  activeSection === "payments"
                    ? "bg-indigo-500 text-white"
                    : "text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                💸 XLM Payments
              </button>
            </div>

            {/* Coffee Contract Section */}
            {activeSection === "coffee" && (
              <BuyCoffeeContract address={address} />
            )}

            {/* Classic Payment Section */}
            {activeSection === "payments" && (
              <>
                <PaymentForm
                  sourceAddress={address}
                  onSuccess={handlePaymentSuccess}
                />
                <TransactionHistory
                  address={address}
                  refreshTrigger={refreshCount}
                />
              </>
            )}
          </>
        )}

        {!address && (
          <div className="text-center text-gray-400 py-16 space-y-3">
            <p className="text-5xl">☕</p>
            <p className="text-sm">Connect your Freighter wallet to get started</p>
          </div>
        )}
      </div>
    </main>
  );
}