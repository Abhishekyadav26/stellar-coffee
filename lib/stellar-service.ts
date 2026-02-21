import { CONTRACT_CONFIG } from '@/config/contract';
import * as StellarSdk from '@stellar/stellar-sdk';
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID
} from '@creit.tech/stellar-wallets-kit';

// Types
export interface Tip {
  from: string;
  amount: number;
  message: string;
}

export interface LeaderboardEntry {
  address: string;
  totalAmount: number;
}

/**
 * Stellar Helper - Blockchain Logic with Stellar Wallets Kit
 * ⚠️ DO NOT MODIFY THIS FILE! ⚠️
 */
export class StellarHelper {
  private server: StellarSdk.Horizon.Server;
  private networkPassphrase: string;
  private kit: StellarWalletsKit;
  private network: WalletNetwork;
  protected publicKey: string | null = null;

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.server = new (StellarSdk as any).Horizon.Server(
      network === 'testnet'
        ? 'https://horizon-testnet.stellar.org'
        : 'https://horizon.stellar.org'
    );
    this.networkPassphrase =
      network === 'testnet'
        ? StellarSdk.Networks.TESTNET
        : StellarSdk.Networks.PUBLIC;

    this.network = network === 'testnet'
      ? WalletNetwork.TESTNET
      : WalletNetwork.PUBLIC;

    // Do not initialize StellarWalletsKit on the server (it accesses `window`).
    // We'll lazily initialize it on first use in the browser.
    this.kit = null as unknown as StellarWalletsKit;
  }

  private ensureKit(): void {
    if (this.kit) return;
    if (typeof window === 'undefined') {
      throw new Error('StellarWalletsKit can only be initialized in a browser environment');
    }

    this.kit = new StellarWalletsKit({
      network: this.network,
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });
  }

  isFreighterInstalled(): boolean {
    return true;
  }

  async connectWallet(): Promise<string> {
    try {
      this.ensureKit();
      // Wallet modal'ı aç ve wallet seçildiğinde adresi al
      await this.kit.openModal({
        onWalletSelected: async (option) => {
          console.log('Wallet selected:', option.id);
          this.kit.setWallet(option.id);
        }
      });

      // Seçilen wallet'ın adresini al
      const { address } = await this.kit.getAddress();

      if (!address) {
        throw new Error('Wallet bağlanamadı');
      }

      this.publicKey = address;
      return address;
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      throw new Error('Wallet bağlantısı başarısız: ' + error.message);
    }
  }

  async getBalance(publicKey: string): Promise<{
    xlm: string;
    assets: Array<{ code: string; issuer: string; balance: string }>;
  }> {
    const account = await this.server.loadAccount(publicKey);

    const xlmBalance = account.balances.find(
      (b: any) => b.asset_type === 'native'
    );

    const assets = account.balances
      .filter((b: any) => b.asset_type !== 'native')
      .map((b: any) => ({
        code: b.asset_code,
        issuer: b.asset_issuer,
        balance: b.balance,
      }));

    return {
      xlm: xlmBalance && 'balance' in xlmBalance ? xlmBalance.balance : '0',
      assets,
    };
  }

  async sendPayment(params: {
    from: string;
    to: string;
    amount: string;
    memo?: string;
  }): Promise<{ hash: string; success: boolean }> {
    const account = await this.server.loadAccount(params.from);

    const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    }).addOperation(
      StellarSdk.Operation.payment({
        destination: params.to,
        asset: StellarSdk.Asset.native(),
        amount: params.amount,
      })
    );

    if (params.memo) {
      transactionBuilder.addMemo(StellarSdk.Memo.text(params.memo));
    }

    const transaction = transactionBuilder.setTimeout(180).build();

    // Wallet Kit ile imzala
    this.ensureKit();
    const { signedTxXdr } = await this.kit.signTransaction(transaction.toXDR(), {
      networkPassphrase: this.networkPassphrase,
    });

    const transactionToSubmit = StellarSdk.TransactionBuilder.fromXDR(
      signedTxXdr,
      this.networkPassphrase
    );

    const result = await this.server.submitTransaction(
      transactionToSubmit as StellarSdk.Transaction
    );

    return {
      hash: result.hash,
      success: result.successful,
    };
  }

  async getRecentTransactions(
    publicKey: string,
    limit: number = 10
  ): Promise<Array<{
    id: string;
    type: string;
    amount?: string;
    asset?: string;
    from?: string;
    to?: string;
    createdAt: string;
    hash: string;
  }>> {
    const payments = await this.server
      .payments()
      .forAccount(publicKey)
      .order('desc')
      .limit(limit)
      .call();

    return payments.records.map((payment: any) => ({
      id: payment.id,
      type: payment.type,
      amount: payment.amount,
      asset: payment.asset_type === 'native' ? 'XLM' : payment.asset_code,
      from: payment.from,
      to: payment.to,
      createdAt: payment.created_at,
      hash: payment.transaction_hash,
    }));
  }

  getExplorerLink(hash: string, type: 'tx' | 'account' = 'tx'): string {
    const network = this.networkPassphrase === StellarSdk.Networks.TESTNET ? 'testnet' : 'public';
    return `https://stellar.expert/explorer/${network}/${type}/${hash}`;
  }

  formatAddress(address: string, startChars: number = 4, endChars: number = 4): string {
    if (address.length <= startChars + endChars) {
      return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  disconnect() {
    this.publicKey = null;
    return true;
  }
}

// Coffee Contract Service - extends StellarHelper with contract-specific functionality
export class StellarCoffeeService extends StellarHelper {
  private contractId: string;
  private sorobanServer: any;

  constructor() {
    super('testnet');
    const config = CONTRACT_CONFIG.TESTNET;
    this.contractId = config.CONTRACT_ID;
    
    // Initialize Soroban server for contract interactions
    // For now, we'll skip Soroban server initialization since we're using direct payments
    // This can be implemented later when we add full smart contract support
    this.sorobanServer = null;
  }

  async buyCoffee(amount: number, message: string): Promise<string> {
    const address = await this.getConnectedAddress();
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      // For now, we'll use a simple payment to the contract creator
      // In a full implementation, this would call the smart contract
      const creatorAddress = 'GC6QXTLS3XSA3GJPHODE2ZSCQS2LFAOANOZKUFLKBJNXCRVYV6NJB3RI';
      
      const result = await this.sendPayment({
        from: address,
        to: creatorAddress,
        amount: amount.toString(),
        memo: message || 'Coffee donation!'
      });

      if (result.success) {
        return result.hash;
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Failed to buy coffee:', error);
      throw error;
    }
  }

  async getConnectedAddress(): Promise<string | null> {
    return this.publicKey;
  }

  // Make publicKey accessible to child class
  protected getPublicKey(): string | null {
    return this.publicKey;
  }

  async disconnectWallet(): Promise<void> {
    this.disconnect();
  }

  // Mock contract methods - these would be implemented with actual Soroban contract calls
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    // Mock data for now - would call contract.leaderboard()
    return [
      { address: 'GABC123...', totalAmount: 100 },
      { address: 'GDEF456...', totalAmount: 50 },
      { address: 'GHI789...', totalAmount: 25 }
    ];
  }

  async getTipHistory(): Promise<Tip[]> {
    // Mock data for now - would call contract.tip_history()
    return [
      { from: 'GABC123...', amount: 10, message: 'Great coffee!' },
      { from: 'GDEF456...', amount: 5, message: 'Thanks!' },
      { from: 'GHI789...', amount: 15, message: 'Love it!' }
    ];
  }

  async getTotalDonated(): Promise<number> {
    // Mock implementation - would call contract.total_donated(userAddress)
    return 42;
  }
}

// Singleton instances
export const stellar = new StellarHelper('testnet');
export const stellarService = new StellarCoffeeService();
