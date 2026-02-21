"use client";

import { useState, useEffect } from "react";
import { stellarService } from "@/lib/stellar-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Coffee } from "lucide-react";

export function CoffeeBuyer() {
  const [amount, setAmount] = useState("10");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check wallet connection status
    const checkWallet = async () => {
      try {
        const address = await stellarService.getConnectedAddress();
        setWalletAddress(address);
      } catch (error) {
        console.error("Failed to check wallet status:", error);
      }
    };
    checkWallet();
  }, []);

  const buyCoffee = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!walletAddress) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setTxHash(null);

      const hash = await stellarService.buyCoffee(parseFloat(amount), message);
      setTxHash(hash);
      setMessage(""); // Clear message after successful purchase
    } catch (err) {
      setError("Failed to buy coffee");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coffee className="h-5 w-5" />
          Buy Me a Coffee
        </CardTitle>
        <CardDescription>
          Support the creator with a coffee donation on Stellar Testnet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Status */}
        <div className="space-y-2">
          {walletAddress ? (
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Connected: {formatAddress(walletAddress)}
              </span>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Please connect your wallet using the button in the navigation
                bar
              </p>
            </div>
          )}
        </div>

        {/* Coffee Purchase Form */}
        {walletAddress && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount (XLM)
              </label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount in XLM"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAmount(e.target.value)
                }
                min="1"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message (optional)
              </label>
              <Textarea
                id="message"
                placeholder="Leave a nice message..."
                value={message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setMessage(e.target.value)
                }
                rows={3}
                maxLength={200}
              />
            </div>

            <Button
              onClick={buyCoffee}
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
              className="w-full"
            >
              <Coffee className="h-4 w-4 mr-2" />
              {isLoading ? "Processing..." : `Buy Coffee (${amount} XLM)`}
            </Button>
          </div>
        )}

        {/* Success Message */}
        {txHash && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Coffee purchased successfully!
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Transaction: {txHash}
            </p>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-1 inline-block"
            >
              View on Explorer →
            </a>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {error}
            </p>
          </div>
        )}

        {/* Contract Info */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>
            Contract: CAYRJABAYNE4Q5PYYILXIUZOWKCHJGMURXXWAD7MXGFHGRRSUG5CCIKF
          </p>
          <p>Network: Stellar Testnet</p>
        </div>
      </CardContent>
    </Card>
  );
}
