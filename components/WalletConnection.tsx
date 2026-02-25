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
      <div className="border border-white/10 rounded-lg p-6 bg-white/5 space-y-4">
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-300 text-xs whitespace-pre-line">{error}</p>
          </div>
        )}

        <div className="text-xs text-gray-400 space-y-1">
          <p>💡 Make sure Freighter is installed and enabled</p>
          <p>🔄 Try refreshing the page if connection fails</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-white/10 rounded-lg p-6 bg-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-medium">Connected</span>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 transition-colors"
        >
          <MdLogout /> Disconnect
        </button>
      </div>

      <div className="bg-white/10 rounded-lg p-4 border border-white/20">
        <p className="text-white/60 text-xs mb-2">Your Address</p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-white font-mono text-sm break-all">{publicKey}</p>
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
