/**
 * stellar-helper.ts
 * Production-level Stellar wallet integration helper.
 * Uses @creit.tech/stellar-wallets-kit for multi-wallet support.
 */

import * as StellarSdk from "@stellar/stellar-sdk";
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
} from "@creit.tech/stellar-wallets-kit";

// ─── Config ───────────────────────────────────────────────────────────────────

export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

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
  hash?: string;
}

export interface PaymentResult {
  success: boolean;
  hash?: string;
  error?: string;
}

// ─── StellarHelper Class ──────────────────────────────────────────────────────

export class StellarHelper {
  private server: StellarSdk.Horizon.Server;
  private networkPassphrase: string;
  private horizonUrl: string;
  private walletNetwork: WalletNetwork;
  private kit: StellarWalletsKit | null = null;
  private _publicKey: string | null = null;

  constructor(network: "testnet" | "mainnet" = "testnet") {
    this.horizonUrl =
      network === "testnet"
        ? "https://horizon-testnet.stellar.org"
        : "https://horizon.stellar.org";

    this.networkPassphrase =
      network === "testnet"
        ? StellarSdk.Networks.TESTNET
        : StellarSdk.Networks.PUBLIC;

    this.walletNetwork =
      network === "testnet" ? WalletNetwork.TESTNET : WalletNetwork.PUBLIC;

    this.server = new StellarSdk.Horizon.Server(this.horizonUrl);
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  /**
   * Lazy-initialize StellarWalletsKit (browser-only, safe for SSR/Next.js)
   */
  private ensureKit(): StellarWalletsKit {
    if (this.kit) return this.kit;
    if (typeof window === "undefined") {
      throw new Error(
        "StellarWalletsKit can only be initialized in a browser environment."
      );
    }
    this.kit = new StellarWalletsKit({
      network: this.walletNetwork,
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });
    return this.kit;
  }

  // ─── Wallet ────────────────────────────────────────────────────────────────

  /**
   * Open wallet selection modal and connect. Returns the public key.
   */
  async connectWallet(): Promise<string> {
    const kit = this.ensureKit();

    await kit.openModal({
      onWalletSelected: async (option) => {
        kit.setWallet(option.id);
      },
    });

    const { address } = await kit.getAddress();

    if (!address || !address.startsWith("G")) {
      throw new Error("Invalid or missing public key from wallet.");
    }

    this._publicKey = address;
    return address;
  }

  /**
   * Get the currently connected public key (if any)
   */
  get publicKey(): string | null {
    return this._publicKey;
  }

  /**
   * Disconnect wallet and clear session state
   */
  disconnect(): void {
    this._publicKey = null;
    this.kit = null;
  }

  /**
   * Sign a transaction using the connected wallet
   */
  async signTransaction(xdr: string): Promise<{ signedTxXdr: string }> {
    const kit = this.ensureKit();
    return await kit.signTransaction(xdr, {
      networkPassphrase: this.networkPassphrase,
    });
  }

  // ─── Account ───────────────────────────────────────────────────────────────

  /**
   * Fund a new testnet account using Friendbot
   */
  async fundTestnetAccount(publicKey: string): Promise<boolean> {
    if (this.networkPassphrase !== StellarSdk.Networks.TESTNET) {
      throw new Error("Friendbot is only available on testnet.");
    }
    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check if an account exists on-chain
   */
  async accountExists(publicKey: string): Promise<boolean> {
    try {
      await this.server.loadAccount(publicKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all balances for a Stellar account
   */
  async getAccountBalances(publicKey: string): Promise<BalanceInfo[]> {
    try {
      const account = await this.server.loadAccount(publicKey);
      return account.balances.map((balance) => {
        if (balance.asset_type === "native") {
          return {
            asset: "XLM (Lumens)",
            balance: parseFloat(balance.balance).toFixed(4),
            assetCode: "XLM",
            assetIssuer: "native" as const,
          };
        }
        const b = balance as StellarSdk.Horizon.HorizonApi.BalanceLine;
        return {
          asset: "asset_code" in b ? (b.asset_code ?? "UNKNOWN") : "UNKNOWN",
          balance: parseFloat(balance.balance).toFixed(4),
          assetCode:
            "asset_code" in b ? (b.asset_code ?? "UNKNOWN") : "UNKNOWN",
          assetIssuer:
            "asset_issuer" in b ? (b.asset_issuer ?? "native") : "native",
        };
      });
    } catch {
      return [];
    }
  }

  // ─── Transactions ──────────────────────────────────────────────────────────

  /**
   * Build, sign (via wallet kit), and submit a payment in one call.
   */
  async sendPayment(params: PaymentParams): Promise<PaymentResult> {
    const { destination, amount, memo, sourcePublicKey } = params;

    // Validate destination address
    try {
      StellarSdk.Keypair.fromPublicKey(destination);
    } catch {
      return { success: false, error: "Invalid destination address." };
    }

    // Ensure destination account exists
    const destExists = await this.accountExists(destination);
    if (!destExists) {
      return {
        success: false,
        error:
          "Destination account does not exist. Ask them to activate their account first.",
      };
    }

    try {
      const sourceAccount = await this.server.loadAccount(sourcePublicKey);

      const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      }).addOperation(
        StellarSdk.Operation.payment({
          destination,
          asset: StellarSdk.Asset.native(),
          amount: amount.toString(),
        })
      );

      if (memo) {
        txBuilder.addMemo(StellarSdk.Memo.text(memo));
      }

      const transaction = txBuilder.setTimeout(180).build();

      // Sign with wallet kit
      const kit = this.ensureKit();
      const { signedTxXdr } = await kit.signTransaction(transaction.toXDR(), {
        networkPassphrase: this.networkPassphrase,
      });

      // Submit
      const signed = StellarSdk.TransactionBuilder.fromXDR(
        signedTxXdr,
        this.networkPassphrase
      );
      const result = await this.server.submitTransaction(
        signed as StellarSdk.Transaction
      );

      return { success: result.successful ?? true, hash: result.hash };
    } catch (e: unknown) {
      const error = e as {
        response?: { data?: { extras?: { result_codes?: unknown } } };
        message?: string;
      };
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
   * Build a payment transaction and return its XDR without signing.
   * Useful if you want to sign externally.
   */
  async buildPaymentXDR(params: PaymentParams): Promise<string> {
    const { destination, amount, memo, sourcePublicKey } = params;

    try {
      StellarSdk.Keypair.fromPublicKey(destination);
    } catch {
      throw new Error("Invalid destination address.");
    }

    const destExists = await this.accountExists(destination);
    if (!destExists) {
      throw new Error(
        "Destination account does not exist. Ask them to activate their account first."
      );
    }

    const sourceAccount = await this.server.loadAccount(sourcePublicKey);

    const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination,
          asset: StellarSdk.Asset.native(),
          amount: amount.toString(),
        })
      )
      .setTimeout(180);

    if (memo) {
      txBuilder.addMemo(StellarSdk.Memo.text(memo));
    }

    return txBuilder.build().toXDR();
  }

  /**
   * Submit a pre-signed XDR transaction to the network
   */
  async submitSignedTransaction(signedXDR: string): Promise<PaymentResult> {
    try {
      const transaction = StellarSdk.TransactionBuilder.fromXDR(
        signedXDR,
        this.networkPassphrase
      );
      const result = await this.server.submitTransaction(
        transaction as StellarSdk.Transaction
      );
      return { success: result.successful ?? true, hash: result.hash };
    } catch (e: unknown) {
      const error = e as {
        response?: { data?: { extras?: { result_codes?: unknown } } };
        message?: string;
      };
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
  async getTransactionHistory(
    publicKey: string,
    limit = 10
  ): Promise<TransactionRecord[]> {
    try {
      const payments = await this.server
        .payments()
        .forAccount(publicKey)
        .limit(limit)
        .order("desc")
        .call();

      return payments.records
        .filter(
          (p) => p.type === "payment" || p.type === "create_account"
        )
        .map((p) => {
          if (p.type === "payment") {
            const payment =
              p as StellarSdk.Horizon.ServerApi.PaymentOperationRecord;
            return {
              id: payment.id,
              type: payment.from === publicKey ? "sent" : "received",
              amount: parseFloat(payment.amount).toFixed(4),
              asset:
                payment.asset_type === "native"
                  ? "XLM"
                  : payment.asset_code ?? "UNKNOWN",
              from: payment.from,
              to: payment.to,
              createdAt: payment.created_at,
              hash: payment.transaction_hash,
            };
          }
          const ca =
            p as StellarSdk.Horizon.ServerApi.CreateAccountOperationRecord;
          return {
            id: ca.id,
            type: "create_account",
            amount: ca.starting_balance,
            asset: "XLM",
            from: ca.funder,
            to: ca.account,
            createdAt: ca.created_at,
            hash: ca.transaction_hash,
          };
        });
    } catch {
      return [];
    }
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────

  /**
   * Shorten a Stellar address for display
   */
  shortenAddress(address: string, chars = 6): string {
    if (address.length <= chars * 2) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }

  /**
   * Get Stellar Expert explorer link for a tx or account
   */
  getExplorerLink(hash: string, type: "tx" | "account" = "tx"): string {
    const net =
      this.networkPassphrase === StellarSdk.Networks.TESTNET
        ? "testnet"
        : "public";
    return `https://stellar.expert/explorer/${net}/${type}/${hash}`;
  }
}

// ─── Singleton Export (testnet) ───────────────────────────────────────────────

export const stellar = new StellarHelper("testnet");

// ─── Backward-Compatible Standalone Functions ─────────────────────────────────
// These wrap the singleton so existing code using the old functional API
// continues to work without any changes.

export const server = stellar["server"];
export const HORIZON = HORIZON_URL;

export const connectWallet = () => stellar.connectWallet();
export const disconnect = () => stellar.disconnect();
export const fundTestnetAccount = (pk: string) =>
  stellar.fundTestnetAccount(pk);
export const accountExists = (pk: string) => stellar.accountExists(pk);
export const getAccountBalances = (pk: string) =>
  stellar.getAccountBalances(pk);
export const buildPaymentTransaction = (params: PaymentParams) =>
  stellar.buildPaymentXDR(params);
export const submitSignedTransaction = (xdr: string) =>
  stellar.submitSignedTransaction(xdr);
export const getTransactionHistory = (pk: string, limit?: number) =>
  stellar.getTransactionHistory(pk, limit);
export const shortenAddress = (address: string, chars?: number) =>
  stellar.shortenAddress(address, chars);
export const signTransaction = (xdr: string) => stellar.signTransaction(xdr);