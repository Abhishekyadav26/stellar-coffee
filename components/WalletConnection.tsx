"use client";

import { useState } from "react";
import { stellar } from "@/lib/stellar-helper";
import { FaWallet, FaCopy, FaCheck } from "react-icons/fa";
import { MdLogout } from "react-icons/md";

interface WalletConnectionProps {
  onConnect: (publicKey: string) => void;
  onDisconnect: () => void;
}

export default function WalletConnection({
  onConnect,
  onDisconnect,
}: WalletConnectionProps) {
  const [publicKey, setPublicKey] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>("");

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError("");
      const key = await stellar.connectWallet();
      setPublicKey(key);
      setIsConnected(true);
      onConnect(key);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect wallet";
      setError(errorMessage);
      console.error("Connection error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    stellar.disconnect();
    setPublicKey("");
    setIsConnected(false);
    onDisconnect();
  };

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) {
    return (
      <div className="border border-white/10 rounded-xl p-6 bg-black/40 backdrop-blur-md space-y-4 shadow-2xl">
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
              Connecting...
            </>
          ) : (
            <>
              <FaWallet className="text-lg" />
              Connect Wallet
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/40 rounded-lg p-3">
            <p className="text-red-300 text-xs whitespace-pre-line">{error}</p>
          </div>
        )}

        <div className="text-xs space-y-1">
          <p className="font-bold text-white">
            💡 Make sure your wallet is installed and enabled
          </p>
          <p className="font-bold text-white">
            🔄 Try refreshing if connection fails
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-white/10 rounded-xl p-6 bg-black/40 backdrop-blur-md space-y-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-bold text-white">Connected</span>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 transition-colors"
        >
          <MdLogout /> Disconnect
        </button>
      </div>

      <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
        <p className="text-xs font-bold mb-2 text-white">Your Address</p>
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono font-bold text-sm break-all text-white">
            {publicKey}
          </p>
          <button
            onClick={handleCopyAddress}
            className="text-blue-400 hover:text-blue-300 shrink-0 transition-colors"
            title={copied ? "Copied!" : "Copy address"}
          >
            {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
          </button>
        </div>
      </div>
    </div>
  );
}
