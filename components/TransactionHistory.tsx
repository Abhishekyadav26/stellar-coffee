// components/TransactionHistory.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { getTransactionHistory, shortenAddress, TransactionRecord } from "@/lib/stellar-helper";

interface Props {
  address: string;
  refreshTrigger?: number;
}

export default function TransactionHistory({ address, refreshTrigger }: Props) {
  const [txs, setTxs] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTxs = useCallback(async () => {
    setLoading(true);
    const data = await getTransactionHistory(address);
    setTxs(data);
    setLoading(false);
  }, [address]);

  useEffect(() => {
    fetchTxs();
  }, [fetchTxs, refreshTrigger]);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
        <button onClick={fetchTxs} className="text-sm text-indigo-500 hover:underline">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : txs.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">No transactions yet.</p>
      ) : (
        <div className="space-y-3">
          {txs.map((tx) => (
            <div
              key={tx.id}
              className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    tx.type === "sent"
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {tx.type.toUpperCase()}
                </span>
                <div>
                  <p className="text-xs text-gray-500 font-mono">
                    {tx.type === "sent"
                      ? `To: ${shortenAddress(tx.to)}`
                      : `From: ${shortenAddress(tx.from)}`}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <span className={`font-mono font-semibold text-sm ${
                tx.type === "sent" ? "text-red-500" : "text-green-500"
              }`}>
                {tx.type === "sent" ? "-" : "+"}{tx.amount} {tx.asset}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}