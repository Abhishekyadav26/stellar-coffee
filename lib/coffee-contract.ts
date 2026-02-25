// lib/coffee-contract.ts
// ⚠️ Soroban smart contract integration for By Me Coffee
// Contract ID: CAYRJABAYNE4Q5PYYILXIUZOWKCHJGMURXXWAD7MXGFHGRRSUG5CCIKF

import * as StellarSdk from "@stellar/stellar-sdk";

export const COFFEE_CONTRACT_ID =
  "CAYRJABAYNE4Q5PYYILXIUZOWKCHJGMURXXWAD7MXGFHGRRSUG5CCIKF";

export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

// 1 XLM = 10_000_000 stroops
export const STROOPS_PER_XLM = BigInt(10000000);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TipRecord {
  from: string;
  amount: string; // in XLM (converted from i128 stroops)
  message: string;
  timestamp?: number;
}

export interface LeaderboardEntry {
  address: string;
  totalDonated: string; // XLM
}

// ─── Soroban RPC Client ───────────────────────────────────────────────────────

function getRpcServer() {
  return new StellarSdk.rpc.Server(SOROBAN_RPC_URL, {
    allowHttp: false,
  });
}

function getContract() {
  return new StellarSdk.Contract(COFFEE_CONTRACT_ID);
}

// ─── Helper: i128 BigInt ↔ XLM string ────────────────────────────────────────

export function xlmToStroops(xlm: string): bigint {
  const [whole, frac = "0"] = xlm.split(".");
  const fracPadded = frac.padEnd(7, "0").slice(0, 7);
  return BigInt(whole) * STROOPS_PER_XLM + BigInt(fracPadded);
}

export function stroopsToXlm(stroops: bigint): string {
  const whole = stroops / STROOPS_PER_XLM;
  const remainder = stroops % STROOPS_PER_XLM;
  const frac = remainder.toString().padStart(7, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

// ─── ScVal Helpers ────────────────────────────────────────────────────────────

function scValToNative(val: StellarSdk.xdr.ScVal): unknown {
  return StellarSdk.scValToNative(val);
}

// ─── READ: total_donated ──────────────────────────────────────────────────────

export async function getTotalDonated(userAddress: string): Promise<string> {
  try {
    const server = getRpcServer();
    const contract = getContract();

    const tx = new StellarSdk.TransactionBuilder(
      new StellarSdk.Account(userAddress, "0"),
      {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      }
    )
      .addOperation(
        contract.call(
          "total_donated",
          StellarSdk.nativeToScVal(userAddress, { type: "address" })
        )
      )
      .setTimeout(30)
      .build();

    const simResult = await server.simulateTransaction(tx);

    if (StellarSdk.rpc.Api.isSimulationError(simResult)) {
      return "0";
    }

    const resultVal = (simResult as StellarSdk.rpc.Api.SimulateTransactionSuccessResponse)
      .result?.retval;
    if (!resultVal) return "0";

    const native = scValToNative(resultVal);
    const stroops = BigInt(native as string | number);
    return stroopsToXlm(stroops);
  } catch {
    return "0";
  }
}

// ─── READ: tip_history ────────────────────────────────────────────────────────

export async function getTipHistory(callerAddress: string): Promise<TipRecord[]> {
  try {
    const server = getRpcServer();
    const contract = getContract();

    const tx = new StellarSdk.TransactionBuilder(
      new StellarSdk.Account(callerAddress, "0"),
      {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      }
    )
      .addOperation(contract.call("tip_history"))
      .setTimeout(30)
      .build();

    const simResult = await server.simulateTransaction(tx);

    if (StellarSdk.rpc.Api.isSimulationError(simResult)) {
      const errorResult = simResult as StellarSdk.rpc.Api.SimulateTransactionErrorResponse;
      console.error("tip_history simulation error:", errorResult.error || 'Unknown error');
      return [];
    }

    const resultVal = (simResult as StellarSdk.rpc.Api.SimulateTransactionSuccessResponse)
      .result?.retval;
    if (!resultVal) return [];

    const native = scValToNative(resultVal) as Array<{
      from?: string;
      amount?: bigint | string | number;
      message?: string;
    }>;

    if (!Array.isArray(native)) return [];

    return native.map((item) => ({
      from: item.from ?? "unknown",
      amount: stroopsToXlm(BigInt(item.amount ?? 0)),
      message: item.message ?? "",
    }));
  } catch (e) {
    console.error("getTipHistory error:", e);
    return [];
  }
}

// ─── READ: leaderboard ────────────────────────────────────────────────────────

export async function getLeaderboard(callerAddress: string): Promise<LeaderboardEntry[]> {
  try {
    const server = getRpcServer();
    const contract = getContract();

    const tx = new StellarSdk.TransactionBuilder(
      new StellarSdk.Account(callerAddress, "0"),
      {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      }
    )
      .addOperation(contract.call("leaderboard"))
      .setTimeout(30)
      .build();

    const simResult = await server.simulateTransaction(tx);

    if (StellarSdk.rpc.Api.isSimulationError(simResult)) {
      const errorResult = simResult as StellarSdk.rpc.Api.SimulateTransactionErrorResponse;
      console.error("leaderboard simulation error:", errorResult.error || 'Unknown error');
      return [];
    }

    const resultVal = (simResult as StellarSdk.rpc.Api.SimulateTransactionSuccessResponse)
      .result?.retval;
    if (!resultVal) return [];

    const native = scValToNative(resultVal) as Array<[string, bigint | string | number]>;
    if (!Array.isArray(native)) return [];

    return native.map(([address, amount]) => ({
      address,
      totalDonated: stroopsToXlm(BigInt(amount ?? 0)),
    }));
  } catch (e) {
    console.error("getLeaderboard error:", e);
    return [];
  }
}

// ─── WRITE: buy_coffee ────────────────────────────────────────────────────────
// Returns signed XDR ready to submit. Signing is done via Freighter.

export async function buildBuyCoffeeTransaction(
  fromAddress: string,
  amountXlm: string,
  message: string
): Promise<string> {
  const server = getRpcServer();
  const contract = getContract();

  const amountStroops = xlmToStroops(amountXlm);

  const account = await server.getAccount(fromAddress);

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "1000000", // high fee for Soroban
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "buy_coffee",
        StellarSdk.nativeToScVal(fromAddress, { type: "address" }),
        StellarSdk.nativeToScVal(amountStroops, { type: "i128" }),
        StellarSdk.nativeToScVal(message, { type: "string" })
      )
    )
    .setTimeout(30)
    .build();

  // Simulate to get footprint / auth entries
  const simResult = await server.simulateTransaction(tx);

  if (StellarSdk.rpc.Api.isSimulationError(simResult)) {
    const errorResult = simResult as StellarSdk.rpc.Api.SimulateTransactionErrorResponse;
    throw new Error(`Simulation failed: ${errorResult.error || 'Unknown error'}`);
  }

  // Assemble the transaction with simulation results (adds soroban data, fees)
  const assembledTx = StellarSdk.rpc.assembleTransaction(
    tx,
    simResult as StellarSdk.rpc.Api.SimulateTransactionSuccessResponse
  ).build();

  return assembledTx.toXDR();
}

export async function submitCoffeeTransaction(
  signedXDR: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const server = getRpcServer();

    const tx = StellarSdk.TransactionBuilder.fromXDR(
      signedXDR,
      NETWORK_PASSPHRASE
    );

    const sendResult = await server.sendTransaction(tx);

    if (sendResult.status === "ERROR") {
      return { success: false, error: sendResult.errorResult?.toString() ?? "Submit error" };
    }

    // Poll for confirmation
    const hash = sendResult.hash;
    let attempts = 0;
    while (attempts < 15) {
      await new Promise((r) => setTimeout(r, 2000));
      const getResult = await server.getTransaction(hash);

      if (getResult.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
        return { success: true, hash };
      }
      if (getResult.status === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) {
        return { success: false, error: "Transaction failed on-chain", hash };
      }
      attempts++;
    }

    return { success: false, error: "Transaction confirmation timeout", hash };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}