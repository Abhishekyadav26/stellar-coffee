// components/BalanceDisplay.tsx
"use client";

import { useEffect, useState } from "react";
import { getAccountBalances, BalanceInfo } from "@/lib/stellar-helper";

interface Props {
  address: string;
  refreshTrigger?: number;
}

export default function BalanceDisplay({ address, refreshTrigger }: Props) {
  const [balances, setBalances] = useState<BalanceInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      if (!controller.signal.aborted) {
        setLoading(true);
        const data = await getAccountBalances(address);
        if (!controller.signal.aborted) {
          setBalances(data);
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => controller.abort();
  }, [address, refreshTrigger]);

  return (
    <div className="border border-white/10 rounded-lg p-6 bg-white/5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Balances</h2>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-12 bg-white/10 rounded-xl animate-pulse"
            />
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
              className="flex justify-between items-center bg-white/10 rounded-xl px-4 py-3 border border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-400">
                    {b.assetCode.slice(0, 3)}
                  </span>
                </div>
                <span className="font-medium text-gray-300">{b.assetCode}</span>
              </div>
              <span className="font-mono font-semibold text-white">
                {b.balance}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
