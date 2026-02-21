export const CONTRACT_CONFIG = {
  TESTNET: {
    CONTRACT_ID: 'CAYRJABAYNE4Q5PYYILXIUZOWKCHJGMURXXWAD7MXGFHGRRSUG5CCIKF',
    NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
    HORIZON_URL: 'https://horizon-testnet.stellar.org',
    SOROBAN_RPC_URL: 'https://soroban-testnet.stellar.org'
  }
} as const;

export type NetworkType = keyof typeof CONTRACT_CONFIG;
