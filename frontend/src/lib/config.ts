/**
 * Network & contract configuration for Nova Esusu.
 *
 * Contract IDs below are the LIVE Testnet deployments.
 */

export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

/** SavingsPool contract (escrow engine) — deployed on Testnet. */
export const SAVINGS_POOL_CONTRACT_ID =
  "CBUAFLZ73UQ2E5OG6BJO6WENSQZ43PL5N4MPC2AIMNUUNP4RQZYTJZY3";

/** MemberManager contract (reputation) — deployed on Testnet. */
export const MEMBER_MANAGER_CONTRACT_ID =
  "CARQ3I5YX6TH4G3NRLWG7EFGPV4VCYNALKCYKFMV56TCSP56XDIL5UTM";

/** Native XLM Stellar Asset Contract (SAC) on Testnet. */
export const NATIVE_XLM_SAC =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

/** Event polling interval for the live feed. */
export const POLL_INTERVAL_MS = 5000;

/** 1 XLM = 10,000,000 stroops. */
export const STROOPS_PER_XLM = 10_000_000;

export const NETWORK = {
  rpc: SOROBAN_RPC_URL,
  horizon: HORIZON_URL,
  passphrase: NETWORK_PASSPHRASE,
} as const;

export const CONTRACTS = {
  savingsPool: SAVINGS_POOL_CONTRACT_ID,
  memberManager: MEMBER_MANAGER_CONTRACT_ID,
  xlmSac: NATIVE_XLM_SAC,
} as const;
