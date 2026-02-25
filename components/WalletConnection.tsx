// components/WalletConnection.tsx
"use client";

import { useState } from "react";
import {
  shortenAddress,
  fundTestnetAccount,
  accountExists,
} from "@/lib/stellar-helper";

interface Props {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  address: string | null;
}

export default function WalletConnection({
  onConnect,
  onDisconnect,
  address,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [funding, setFunding] = useState(false);

  async function connectWallet() {
    setLoading(true);
    setError(null);
    try {
      // Freighter injects window.freighter
      const freighter = (
        window as unknown as {
          freighter?: {
            isConnected: () => Promise<boolean>;
            requestAccess: () => Promise<string>;
            getPublicKey: () => Promise<string>;
            getNetwork: () => Promise<string>;
          };
        }
      ).freighter;

      if (!freighter) {
        throw new Error(
          "Freighter wallet not found. Please install the Freighter extension.",
        );
      }

      const connected = await freighter.isConnected();
      if (!connected) {
        await freighter.requestAccess();
      }

      const publicKey = await freighter.getPublicKey();
      const network = await freighter.getNetwork();

      if (network !== "TESTNET") {
        throw new Error("Please switch Freighter to Testnet network.");
      }

      onConnect(publicKey);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  }

  async function fundAccount() {
    if (!address) return;
    setFunding(true);
    setError(null);
    try {
      const exists = await accountExists(address);
      if (exists) {
        setError("Account already funded on testnet!");
        return;
      }
      const success = await fundTestnetAccount(address);
      if (!success) throw new Error("Friendbot funding failed. Try again.");
      alert("Account funded with 10,000 XLM on testnet!");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Funding failed");
    } finally {
      setFunding(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Wallet</h2>

      {!address ? (
        <div className="space-y-3">
          <button
            onClick={connectWallet}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Connect Freighter"}
          </button>
          <p className="text-sm text-gray-500 text-center">
            Don&apos;t have Freighter?{" "}
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 underline"
            >
              Install here
            </a>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="font-mono text-sm text-gray-700">
              {shortenAddress(address)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fundAccount}
              disabled={funding}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 px-3 rounded-xl transition disabled:opacity-50"
            >
              {funding ? "Funding..." : "Fund via Friendbot"}
            </button>
            <button
              onClick={onDisconnect}
              className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 text-sm font-medium py-2 px-3 rounded-xl transition"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>
      )}
    </div>
  );
}
