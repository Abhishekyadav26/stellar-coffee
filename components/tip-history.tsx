"use client";

import { useState, useEffect } from "react";
import { stellarService, Tip } from "@/lib/stellar-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageCircle, RefreshCw, Coffee } from "lucide-react";

export function TipHistory() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTipHistory = async () => {
    try {
      setIsLoading(true);
      const data = await stellarService.getTipHistory();
      setTips(data);
    } catch (error) {
      console.error("Failed to fetch tip history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTipHistory();
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Recent Coffee Tips
        </CardTitle>
        <CardDescription>Latest coffee purchases and messages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Refresh Button */}
          <div className="flex justify-end">
            <button
              onClick={fetchTipHistory}
              disabled={isLoading}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {/* Tips List */}
          {tips.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {isLoading
                ? "Loading..."
                : "No coffee tips yet. Be the first to leave a message!"}
            </div>
          ) : (
            <div className="space-y-4">
              {tips.map((tip, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-medium text-sm">
                        {formatAddress(tip.from)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-green-600 dark:text-green-400">
                        {tip.amount} XLM
                      </div>
                    </div>
                  </div>

                  {tip.message && (
                    <div className="bg-white dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                        &ldquo;{tip.message}&rdquo;
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {/* In real implementation, this would show actual timestamp */}
                    Recent transaction
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          {tips.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Total Tips:</span>
                  <span className="font-medium">{tips.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Volume:</span>
                  <span className="font-medium">
                    {tips.reduce((sum, tip) => sum + tip.amount, 0)} XLM
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Average Tip:</span>
                  <span className="font-medium">
                    {(
                      tips.reduce((sum, tip) => sum + tip.amount, 0) /
                      tips.length
                    ).toFixed(2)}{" "}
                    XLM
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
