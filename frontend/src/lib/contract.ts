import {
  Address,
  BASE_FEE,
  Contract,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import {
  MEMBER_MANAGER_CONTRACT_ID,
  NETWORK_PASSPHRASE,
  SAVINGS_POOL_CONTRACT_ID,
  SOROBAN_RPC_URL,
} from "./config";
import type { CircleInfo, CircleState, Reputation } from "./types";
import { signTxXdr } from "./wallet";

let _server: rpc.Server | null = null;

export function getServer(): rpc.Server {
  if (!_server) _server = new rpc.Server(SOROBAN_RPC_URL);
  return _server;
}

const DUMMY_ACCOUNT =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

// ---------------------------------------------------------------------------
// ScVal helpers
// ---------------------------------------------------------------------------

export function u32(val: number): xdr.ScVal {
  return nativeToScVal(val, { type: "u32" });
}

export function boolean_(val: boolean): xdr.ScVal {
  return nativeToScVal(val, { type: "bool" });
}

export function strVal(val: string): xdr.ScVal {
  return nativeToScVal(val, { type: "string" });
}

export function addressVal(addr: string): xdr.ScVal {
  return new Address(addr).toScVal();
}

/** Encode a stroops amount (bigint) as an i128 ScVal. */
export function i128ToScVal(stroops: bigint): xdr.ScVal {
  const value = stroops < 0n ? (stroops + 1n << 1n) - 1n : stroops; // no-op normalize
  const lo = BigInt.asUintN(64, value);
  const hi = BigInt.asIntN(64, value >> 64n);
  return xdr.ScVal.scvI128(
    new xdr.Int128Parts({
      lo: new xdr.Uint64(lo),
      hi: new xdr.Int64(hi),
    })
  );
}

/** Decode a Soroban enum variant (Vec<[Symbol]>) to a plain string. */
function decodeEnum(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    // [ "Pending" ] or similar
    const found = v.find((x) => typeof x === "string");
    if (found) return found;
  }
  if (v && typeof v === "object") {
    const rec = v as Record<string, unknown>;
    // soroban enums: { tag?: string, name?: string } or numeric keys
    if (typeof rec.tag === "string") return rec.tag;
    if (typeof rec.name === "string") return rec.name;
    for (const key of Object.keys(rec)) {
      const inner = rec[key];
      if (typeof inner === "string") return inner;
      if (inner === undefined || inner === null) return key;
    }
  }
  return String(v);
}

/** Coerce any scValToNative result to a string (for i128). */
function asString(v: unknown): string {
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number") return v.toString();
  if (typeof v === "string") return v;
  return String(v);
}

function parseCircleInfo(raw: unknown): CircleInfo {
  const o = (raw ?? {}) as Record<string, unknown>;
  const cfg = (o.config ?? {}) as Record<string, unknown>;
  const config = {
    size: Number(cfg.size ?? 0),
    contribution_amount: asString(cfg.contribution_amount ?? cfg.contributionAmount ?? "0"),
    cycle_count: Number(cfg.cycle_count ?? cfg.cycleCount ?? 0),
    is_random_order: Boolean(cfg.is_random_order ?? cfg.isRandomOrder ?? false),
    creator: String(cfg.creator ?? ""),
    name: String(cfg.name ?? "Untitled Circle"),
  };
  const state = (decodeEnum(o.state) as CircleState) || "Pending";
  const members = Array.isArray(o.members) ? (o.members as string[]) : [];
  const payoutOrder = Array.isArray(o.payout_order)
    ? (o.payout_order as string[])
    : Array.isArray(o.payoutOrder)
    ? (o.payoutOrder as string[])
    : [];

  return {
    config,
    state,
    members,
    current_round: Number(o.current_round ?? o.currentRound ?? 1),
    payout_order: payoutOrder,
    total_contributions: asString(o.total_contributions ?? o.totalContributions ?? "0"),
    pool_balance: asString(o.pool_balance ?? o.poolBalance ?? "0"),
  };
}

function parseReputation(raw: unknown): Reputation {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    score: Number(o.score ?? 100),
    circles_joined: Number(o.circles_joined ?? o.circlesJoined ?? 0),
    circles_completed: Number(o.circles_completed ?? o.circlesCompleted ?? 0),
    defaults: Number(o.defaults ?? 0),
    in_good_standing: Boolean(o.in_good_standing ?? o.inGoodStanding ?? true),
  };
}

// ---------------------------------------------------------------------------
// Read operations (simulateTransaction — no signing)
// ---------------------------------------------------------------------------

async function simulateRead(
  contractId: string,
  method: string,
  args: xdr.ScVal[]
): Promise<unknown> {
  const server = getServer();
  const source = new Address(DUMMY_ACCOUNT);
  const account = {
    accountId: () => DUMMY_ACCOUNT,
    sequenceNumber: () => "0",
    incrementSequenceNumber: () => {},
  } as unknown as Parameters<typeof TransactionBuilder>[0];

  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    const msg =
      (sim as rpc.Api.SimulateTransactionFailureResponse).error?.message ??
      "simulation failed";
    throw new Error(`contract: ${msg}`);
  }
  const retval = (sim as rpc.Api.SimulateTransactionSuccessResponse).result?.retval;
  return scValToNative(retval);
}

export async function getCircleState(circleId: number): Promise<CircleInfo> {
  const raw = await simulateRead(SAVINGS_POOL_CONTRACT_ID, "get_circle_state", [
    u32(circleId),
  ]);
  return parseCircleInfo(raw);
}

export async function getCircleCount(): Promise<number> {
  const raw = await simulateRead(SAVINGS_POOL_CONTRACT_ID, "get_circle_count", []);
  return Number(raw);
}

export async function getActiveCircles(): Promise<number[]> {
  const raw = await simulateRead(SAVINGS_POOL_CONTRACT_ID, "get_active_circles", []);
  return Array.isArray(raw) ? (raw as number[]) : [];
}

export async function trackReputation(address: string): Promise<Reputation> {
  const raw = await simulateRead(
    MEMBER_MANAGER_CONTRACT_ID,
    "track_reputation",
    [addressVal(address)]
  );
  return parseReputation(raw);
}

export async function checkEligibility(
  address: string,
  circleId: number
): Promise<boolean> {
  const raw = await simulateRead(MEMBER_MANAGER_CONTRACT_ID, "check_eligibility", [
    addressVal(address),
    u32(circleId),
  ]);
  return Boolean(raw);
}

export async function getAllCircles(): Promise<CircleInfo[]> {
  const count = await getCircleCount();
  const ids = Array.from({ length: count }, (_, i) => i + 1);
  const results = await Promise.allSettled(ids.map((id) => getCircleState(id)));
  return results
    .filter(
      (r): r is PromiseFulfilledResult<CircleInfo> => r.status === "fulfilled"
    )
    .map((r) => r.value);
}

// ---------------------------------------------------------------------------
// Write operations (prepare → sign via wallet → submit → poll)
// ---------------------------------------------------------------------------

export type SendStatus = "preparing" | "signing" | "submitting" | "pending" | "done";

export interface SubmitOptions {
  onStatus?: (status: SendStatus) => void;
}

async function submitWrite(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  signer: string,
  opts: SubmitOptions = {}
): Promise<string> {
  const server = getServer();
  opts.onStatus?.("preparing");

  const account = await server.getAccount(signer);
  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(180)
    .build();

  const prepared = await server.prepareTransaction(tx);

  opts.onStatus?.("signing");
  const signedXdr = await signTxXdr(prepared.toXDR(), signer);
  const signed = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  opts.onStatus?.("submitting");
  const sendResp = await server.sendTransaction(signed);

  if (sendResp.status === "ERROR") {
    throw new Error(
      `contract: ${sendResp.errorResult?.result()?.toString() ?? "submission failed"}`
    );
  }

  // Poll for confirmation.
  let hash = sendResp.hash;
  let getResp = await server.getTransaction(hash);
  let attempts = 0;
  while (getResp.status === rpc.Api.GetTransactionStatus.NOT_FOUND && attempts < 30) {
    opts.onStatus?.("pending");
    await new Promise((r) => setTimeout(r, 2000));
    getResp = await server.getTransaction(hash);
    attempts++;
  }

  if (getResp.status === rpc.Api.GetTransactionStatus.SUCCESS) {
    opts.onStatus?.("done");
    return hash;
  }
  if (getResp.status === rpc.Api.GetTransactionStatus.FAILED) {
    throw new Error("contract: transaction failed on-chain");
  }
  opts.onStatus?.("done");
  return hash;
}

export function createCircle(
  signer: string,
  name: string,
  size: number,
  contributionAmountStroops: bigint,
  cycleCount: number,
  isRandomOrder: boolean,
  opts?: SubmitOptions
): Promise<string> {
  return submitWrite(
    SAVINGS_POOL_CONTRACT_ID,
    "create_circle",
    [
      addressVal(signer),
      strVal(name),
      u32(size),
      i128ToScVal(contributionAmountStroops),
      u32(cycleCount),
      boolean_(isRandomOrder),
    ],
    signer,
    opts
  );
}

export function joinCircle(
  signer: string,
  circleId: number,
  opts?: SubmitOptions
): Promise<string> {
  return submitWrite(
    SAVINGS_POOL_CONTRACT_ID,
    "join_circle",
    [addressVal(signer), u32(circleId)],
    signer,
    opts
  );
}

export function contribute(
  signer: string,
  circleId: number,
  amountStroops: bigint,
  opts?: SubmitOptions
): Promise<string> {
  return submitWrite(
    SAVINGS_POOL_CONTRACT_ID,
    "contribute",
    [addressVal(signer), u32(circleId), i128ToScVal(amountStroops)],
    signer,
    opts
  );
}

export function processPayout(
  signer: string,
  circleId: number,
  opts?: SubmitOptions
): Promise<string> {
  return submitWrite(
    SAVINGS_POOL_CONTRACT_ID,
    "process_payout",
    [addressVal(signer), u32(circleId)],
    signer,
    opts
  );
}

export function handleDefault(
  signer: string,
  circleId: number,
  member: string,
  opts?: SubmitOptions
): Promise<string> {
  return submitWrite(
    SAVINGS_POOL_CONTRACT_ID,
    "handle_default",
    [addressVal(signer), u32(circleId), addressVal(member)],
    signer,
    opts
  );
}
