"use client";

// app/page.tsx — Updated to include BuyCoffeeContract integration

import { useState } from "react";
import WalletConnection from "@/components/WalletConnection";
import BalanceDisplay from "@/components/BalanceDisplay";
import PaymentForm from "@/components/PaymentForm";
import TransactionHistory from "@/components/TransactionHistory";
import BuyCoffeeContract from "@/components/BuyCoffeeContract";
import { GradientDots } from "@/components/ui/gradient-dots";

export default function Home() {
  const [address, setAddress] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [activeSection, setActiveSection] = useState<"payments" | "coffee">(
    "coffee",
  );

  function handlePaymentSuccess() {
    setRefreshCount((c) => c + 1);
  }

  const handleWalletConnect = (publicKey: string) => {
    setAddress(publicKey);
  };

  const handleWalletDisconnect = () => {
    setAddress(null);
  };

  return (
    <main className="relative min-h-screen">
      <GradientDots
        duration={25}
        dotSize={2}
        spacing={24}
        backgroundColor="oklch(0.04 0 0)"
        className="opacity-20"
      />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <span className="text-4xl">☕</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-purple-400 to-pink-400">
            Buy me a coffee
          </h1>
          <p className="text-xl font-bold text-white">
            Multi-Wallet Support · Stellar Testnet · Soroban Contracts
          </p>
          <div className="flex justify-center">
            <span className="inline-block text-base font-bold bg-linear-to-r from-blue-600/20 to-purple-600/20 text-white px-4 py-2 rounded-full border border-blue-500/30 backdrop-blur-sm">
              🧪 Testnet Only
            </span>
          </div>
        </div>

        {/* Wallet */}
        <WalletConnection
          onConnect={handleWalletConnect}
          onDisconnect={handleWalletDisconnect}
        />

        {address && (
          <>
            <BalanceDisplay address={address} refreshTrigger={refreshCount} />

            {/* Section Switcher */}
            <div className="flex rounded-xl overflow-hidden border border-white/10 bg-black/30 backdrop-blur-md shadow-xl">
              <button
                onClick={() => setActiveSection("coffee")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
                  activeSection === "coffee"
                    ? "bg-amber-500 text-white shadow-lg"
                    : "text-amber-400 hover:bg-black/40"
                }`}
              >
                ☕ By Me a Coffee Contract
              </button>
              <button
                onClick={() => setActiveSection("payments")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
                  activeSection === "payments"
                    ? "bg-indigo-500 text-white shadow-lg"
                    : "text-indigo-400 hover:bg-black/40"
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
          <div className="text-center py-20 space-y-6">
            <div className="inline-flex items-center justify-center p-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <span className="text-6xl">☕</span>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-extrabold text-white">
                Connect Your Wallet
              </p>
              <p className="text-base font-bold text-white">
                Start your Stellar journey by connecting your wallet
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
