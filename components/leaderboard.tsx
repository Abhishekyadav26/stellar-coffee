'use client';

import { useState, useEffect } from 'react';
import { stellarService, LeaderboardEntry } from '@/lib/stellar-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, RefreshCw } from 'lucide-react';

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const data = await stellarService.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Coffee Leaderboard
        </CardTitle>
        <CardDescription>
          Top coffee supporters on Stellar Testnet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Refresh Button */}
          <div className="flex justify-end">
            <button
              onClick={fetchLeaderboard}
              disabled={isLoading}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Leaderboard List */}
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {isLoading ? 'Loading...' : 'No coffee purchases yet. Be the first!'}
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.address}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold w-8 text-center">
                      {getMedalEmoji(index + 1)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {formatAddress(entry.address)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {entry.totalAmount} XLM total
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">
                      {entry.totalAmount} XLM
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total Stats */}
          {leaderboard.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Total Supporters:</span>
                  <span className="font-medium">{leaderboard.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Donated:</span>
                  <span className="font-medium">
                    {leaderboard.reduce((sum, entry) => sum + entry.totalAmount, 0)} XLM
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
