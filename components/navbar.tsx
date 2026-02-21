'use client';

import { useState, useEffect } from 'react';
import { stellarService } from '@/lib/stellar-service';
import { Button } from '@/components/ui/button';
import { Wallet, Coffee, LogOut } from 'lucide-react';

export function Navbar() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      try {
        const address = await stellarService.getConnectedAddress();
        if (address) {
          setWalletAddress(address);
          // Fetch balance
          const balanceData = await stellarService.getBalance(address);
          setBalance(balanceData.xlm);
        }
      } catch (error) {
        console.error('Failed to check wallet connection:', error);
      }
    };
    checkConnection();
  }, []);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      const address = await stellarService.connectWallet();
      setWalletAddress(address);
      
      // Fetch balance after connection
      const balanceData = await stellarService.getBalance(address);
      setBalance(balanceData.xlm);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await stellarService.disconnectWallet();
      setWalletAddress(null);
      setBalance('0');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return num.toFixed(2);
  };

  return (
    <nav className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Coffee className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Coffee dApp
            </span>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center gap-4">
            {walletAddress ? (
              <div className="flex items-center gap-3">
                {/* Balance Display */}
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatBalance(balance)} XLM
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatAddress(walletAddress)}
                  </div>
                </div>
                
                {/* Disconnect Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnectWallet}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Disconnect</span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                {isLoading ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
