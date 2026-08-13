// Wallet integration using @creit.tech/stellar-wallets-kit.
// The kit exposes a class with static methods: init(), authModal(),
// getAddress(), signTransaction(), setWallet(), disconnect().
// Supports Freighter, Albedo, and xBull via the kit's modal picker.

import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule, FREIGHTER_ID } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { classifyError } from "./errors";
import type { ClassifiedError } from "./types";
export { classifyError };

let initialised = false;

/** Initialise the wallet kit exactly once. Safe to call multiple times. */
export function initWallet(): void {
  if (initialised) return;
  StellarWalletsKit.init({
    network: Networks.TESTNET,
    selectedWalletId: FREIGHTER_ID,
    modules: [new FreighterModule(), new AlbedoModule(), new xBullModule()],
  });
  initialised = true;
}

/** Has the wallet kit been initialised this session? */
export function isWalletInitialised(): boolean {
  return initialised;
}

/**
 * Open the wallet-selection modal and connect the user.
 * Resolves with the connected public key, or rejects if the user cancels.
 */
export async function connectWallet(): Promise<string> {
  initWallet();
  const { address } = await StellarWalletsKit.authModal();
  if (!address) throw new Error("No wallet connected.");
  return address;
}

/** Return the currently connected public key (G…) or throw. */
export async function getAddress(): Promise<string> {
  initWallet();
  const { address } = await StellarWalletsKit.getAddress();
  if (!address) throw new Error("No wallet connected.");
  return address;
}

/** Is there a wallet address already stored in the kit? */
export async function tryGetAddress(): Promise<string | null> {
  try {
    initWallet();
    const { address } = await StellarWalletsKit.getAddress();
    return address || null;
  } catch {
    return null;
  }
}

/** Sign an XDR transaction envelope and return the signed XDR. */
export async function signTxn(xdr: string, publicKey?: string): Promise<string> {
  initWallet();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    address: publicKey,
    networkPassphrase: Networks.TESTNET,
  });
  return signedTxXdr;
}

/** Alias used by contract.ts */
export { signTxn as signTxXdr };

/** Alias used by WalletContext */
export { tryGetAddress as getConnectedAddress };

/** Forget the connected wallet. */
export async function disconnectWallet(): Promise<void> {
  initWallet();
  await StellarWalletsKit.disconnect();
}
