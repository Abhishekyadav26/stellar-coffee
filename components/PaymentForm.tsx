// components/PaymentForm.tsx
"use client";

import { useState } from "react";
import {
  buildPaymentTransaction,
  submitSignedTransaction,
} from "@/lib/stellar-helper";

interface Props {
  sourceAddress: string;
  onSuccess: () => void;
}

export default function PaymentForm({ sourceAddress, onSuccess }: Props) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [status, setStatus] = useState<
    "idle" | "building" | "signing" | "submitting"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function handleSend() {
    setError(null);
    setTxHash(null);
    if (!destination || !amount) {
      setError("Destination and amount are required.");
      return;
    }

    try {
      // Step 1: Build the transaction (get XDR)
      setStatus("building");
      const xdr = await buildPaymentTransaction({
        destination,
        amount,
        memo,
        sourcePublicKey: sourceAddress,
      });

      // Step 2: Ask Freighter to sign
      setStatus("signing");
      const freighter = (
        window as unknown as {
          freighter?: {
            signTransaction: (
              xdr: string,
              opts: { network: string },
            ) => Promise<string>;
          };
        }
      ).freighter;

      if (!freighter) throw new Error("Freighter not found");

      const signedXDR = await freighter.signTransaction(xdr, {
        network: "TESTNET",
      });

      // Step 3: Submit to Stellar network
      setStatus("submitting");
      const result = await submitSignedTransaction(signedXDR);

      if (!result.success) throw new Error(result.error);

      setTxHash(result.hash ?? null);
      setDestination("");
      setAmount("");
      setMemo("");
      onSuccess(); // Trigger balance refresh
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setStatus("idle");
    }
  }

  const isLoading = status !== "idle";

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Send XLM</h2>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">
            Destination Address
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="G..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">
            Amount (XLM)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0.0000001"
            step="0.1"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">
            Memo (optional)
          </label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Payment for..."
            maxLength={28}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      <button
        onClick={handleSend}
        disabled={isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
      >
        {status === "building" && "Building transaction..."}
        {status === "signing" && "Waiting for Freighter signature..."}
        {status === "submitting" && "Submitting to network..."}
        {status === "idle" && "Send Payment"}
      </button>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>
      )}

      {txHash && (
        <div className="text-sm bg-green-50 text-green-700 rounded-lg p-3 space-y-1">
          <p className="font-semibold">Transaction successful!</p>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-mono text-xs break-all"
          >
            {txHash}
          </a>
        </div>
      )}
    </div>
  );
}
