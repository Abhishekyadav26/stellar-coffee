// components/BalanceDisplay.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { getAccountBalances, BalanceInfo } from "@/lib/stellar-helper";

interface Props {
  address: string;
  refreshTrigger?: number;
}

export default function BalanceDisplay({ address, refreshTrigger }: Props) {
  const [balances, setBalances] = useState<BalanceInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    const data = await getAccountBalances(address);
    setBalances(data);
    setLoading(false);
  }, [address]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances, refreshTrigger]);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Balances</h2>
        <button
          onClick={fetchBalances}
          className="text-sm text-indigo-500 hover:underline"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : balances.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">
          No balances found. Fund your account first!
        </p>
      ) : (
        <div className="space-y-3">
          {balances.map((b, i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-indigo-600">
                    {b.assetCode.slice(0, 3)}
                  </span>
                </div>
                <span className="font-medium text-gray-700">{b.assetCode}</span>
              </div>
              <span className="font-mono font-semibold text-gray-900">
                {b.balance}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}