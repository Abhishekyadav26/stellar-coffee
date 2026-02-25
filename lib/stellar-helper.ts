// lib/stellar-helper.ts
import * as StellarSdk from "@stellar/stellar-sdk";

// ─── Config ───────────────────────────────────────────────────────────────────
export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const server = new StellarSdk.Horizon.Server(HORIZON_URL);

// ─── Types ────────────────────────────────────────────────────────────────────
export interface WalletState {
  address: string | null;
  isConnected: boolean;
}

export interface BalanceInfo {
  asset: string;
  balance: string;
  assetCode: string;
  assetIssuer: string | "native";
}

export interface PaymentParams {
  destination: string;
  amount: string;
  memo?: string;
  sourcePublicKey: string;
}

export interface TransactionRecord {
  id: string;
  type: string;
  amount: string;
  asset: string;
  from: string;
  to: string;
  createdAt: string;
  memo?: string;
}

// ─── Account Helpers ──────────────────────────────────────────────────────────

/**
 * Fund a new testnet account using Friendbot
 */
export async function fundTestnetAccount(publicKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://friendbot.stellar.org?addr=${publicKey}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Check if an account exists on the testnet
 */
export async function accountExists(publicKey: string): Promise<boolean> {
  try {
    await server.loadAccount(publicKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all balances for a Stellar account
 */
export async function getAccountBalances(
  publicKey: string
): Promise<BalanceInfo[]> {
  try {
    const account = await server.loadAccount(publicKey);
    return account.balances.map((balance) => {
      if (balance.asset_type === "native") {
        return {
          asset: "XLM (Lumens)",
          balance: parseFloat(balance.balance).toFixed(4),
          assetCode: "XLM",
          assetIssuer: "native",
        };
      }
      const b = balance as StellarSdk.Horizon.HorizonApi.BalanceLine;
      return {
        asset: `${"asset_code" in b ? b.asset_code : "UNKNOWN"}`,
        balance: parseFloat(balance.balance).toFixed(4),
        assetCode: "asset_code" in b ? (b.asset_code ?? "UNKNOWN") : "UNKNOWN",
        assetIssuer:
          "asset_issuer" in b ? (b.asset_issuer ?? "native") : "native",
      };
    });
  } catch {
    return [];
  }
}

/**
 * Build a payment transaction (returns XDR, does NOT sign)
 */
export async function buildPaymentTransaction(
  params: PaymentParams
): Promise<string> {
  const { destination, amount, memo, sourcePublicKey } = params;

  // Validate destination
  try {
    StellarSdk.Keypair.fromPublicKey(destination);
  } catch {
    throw new Error("Invalid destination address");
  }

  // Ensure destination account exists — if not, fund it
  const destExists = await accountExists(destination);
  if (!destExists) {
    throw new Error(
      "Destination account does not exist. Ask them to activate their account first."
    );
  }

  const sourceAccount = await server.loadAccount(sourcePublicKey);

  const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset: StellarSdk.Asset.native(),
        amount: amount.toString(),
      })
    )
    .setTimeout(30);

  if (memo) {
    txBuilder.addMemo(StellarSdk.Memo.text(memo));
  }

  const transaction = txBuilder.build();
  return transaction.toXDR(); // Return XDR string for Freighter to sign
}

/**
 * Submit a signed XDR transaction to the network
 */
export async function submitSignedTransaction(
  signedXDR: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      signedXDR,
      NETWORK_PASSPHRASE
    );
    const result = await server.submitTransaction(transaction);
    return { success: true, hash: result.hash };
  } catch (e: unknown) {
    const error = e as { response?: { data?: { extras?: { result_codes?: unknown } } }; message?: string };
    const resultCodes = error?.response?.data?.extras?.result_codes;
    return {
      success: false,
      error: resultCodes
        ? JSON.stringify(resultCodes)
        : error?.message ?? "Unknown error",
    };
  }
}

/**
 * Fetch recent transactions for an account
 */
export async function getTransactionHistory(
  publicKey: string,
  limit = 10
): Promise<TransactionRecord[]> {
  try {
    const payments = await server
      .payments()
      .forAccount(publicKey)
      .limit(limit)
      .order("desc")
      .call();

    return payments.records
      .filter((p) => p.type === "payment" || p.type === "create_account")
      .map((p) => {
        if (p.type === "payment") {
          const payment = p as StellarSdk.Horizon.ServerApi.PaymentOperationRecord;
          return {
            id: payment.id,
            type: payment.from === publicKey ? "sent" : "received",
            amount: parseFloat(payment.amount).toFixed(4),
            asset:
              payment.asset_type === "native" ? "XLM" : payment.asset_code ?? "UNKNOWN",
            from: payment.from,
            to: payment.to,
            createdAt: payment.created_at,
          };
        }
        // create_account op
        const ca = p as StellarSdk.Horizon.ServerApi.CreateAccountOperationRecord;
        return {
          id: ca.id,
          type: "create_account",
          amount: ca.starting_balance,
          asset: "XLM",
          from: ca.funder,
          to: ca.account,
          createdAt: ca.created_at,
        };
      });
  } catch {
    return [];
  }
}

/**
 * Shorten a Stellar address for display
 */
export function shortenAddress(address: string, chars = 6): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// ─── Wallet Connection Helpers ──────────────────────────────────────────────────

/**
 * Connect to Freighter wallet and return public key
 */
export async function connectWallet(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error("Wallet connection is only available in the browser.");
  }

  // Check for Freighter multiple times with delays
  let freighter = null;
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts && !freighter) {
    freighter = (window as unknown as { freighter?: {
      isConnected: () => Promise<boolean>;
      requestAccess: () => Promise<string>;
      getPublicKey: () => Promise<string>;
      getNetwork: () => Promise<string>;
    } }).freighter;
    
    if (!freighter && attempts < maxAttempts - 1) {
      // Wait longer between attempts
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    attempts++;
  }

  if (!freighter) {
    throw new Error(
      "Freighter wallet not found. Please:\n" +
      "1. Install Freighter from https://freighter.app\n" +
      "2. Enable the extension in your browser\n" +
      "3. Refresh this page\n" +
      "4. Try in a new tab if issues persist"
    );
  }

  try {
    const connected = await freighter.isConnected();
    if (!connected) {
      await freighter.requestAccess();
    }

    const publicKey = await freighter.getPublicKey();
    const network = await freighter.getNetwork();

    if (network !== "TESTNET") {
      throw new Error(
        "Please switch Freighter to Testnet network. Click the Freighter icon and select Testnet."
      );
    }

    if (!publicKey || !publicKey.startsWith('G')) {
      throw new Error("Invalid public key received from Freighter.");
    }

    return publicKey;
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message.includes("User rejected")) {
      throw new Error("Connection request was rejected. Please try again and approve the connection.");
    }
    if (err.message.includes("not unlocked")) {
      throw new Error("Please unlock Freighter with your password and try again.");
    }
    throw error;
  }
}

/**
 * Disconnect wallet (clear session)
 */
export function disconnect(): void {
  // Freighter doesn't have a formal disconnect method
  // This is mainly for UI state management
  console.log("Wallet disconnected");
}

/**
 * Export stellar object for backward compatibility
 */
export const stellar = {
  connectWallet,
  disconnect,
};