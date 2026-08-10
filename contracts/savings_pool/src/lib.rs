//! SavingsPool contract — the escrow engine for Nova Esusu circles.
//!
//! Members contribute XLM (native SAC) into escrow. Once every member has paid
//! for the current round, anyone may call `process_payout` to release the full
//! pot to that round's recipient and advance the rotation. Defaulting members
//! are penalized through a cross-contract call to MemberManager.

#![no_std]

use shared::{CircleConfig, CircleInfo, CircleState, ManagerClient, PoolTrait};
use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, Env, String, Vec};

// ---- instance storage keys ----
const ADMIN: soroban_sdk::Symbol = symbol_short!("ADMIN");
const MANAGER: soroban_sdk::Symbol = symbol_short!("MANAGER");
const TOKEN: soroban_sdk::Symbol = symbol_short!("TOKEN");
const CIRCLE_COUNT: soroban_sdk::Symbol = symbol_short!("CCOUNT");

// ---- persistent storage keys (tuples keep per-circle data isolated) ----
const CIRCLE: soroban_sdk::Symbol = symbol_short!("CIRCLE");
const ROUND: soroban_sdk::Symbol = symbol_short!("ROUND");

fn read_manager(env: &Env) -> Address {
    env.storage().instance().get(&MANAGER).unwrap_or_else(|| panic!("not initialized"))
}

fn read_token(env: &Env) -> Address {
    env.storage().instance().get(&TOKEN).unwrap_or_else(|| panic!("not initialized"))
}

fn read_count(env: &Env) -> u32 {
    env.storage().instance().get(&CIRCLE_COUNT).unwrap_or(0)
}

fn circle_key(circle_id: u32) -> (soroban_sdk::Symbol, u32) {
    (CIRCLE, circle_id)
}

fn round_key(circle_id: u32) -> (soroban_sdk::Symbol, u32) {
    (ROUND, circle_id)
}

fn get_circle(env: &Env, circle_id: u32) -> CircleInfo {
    env.storage()
        .persistent()
        .get(&circle_key(circle_id))
        .unwrap_or_else(|| panic!("circle not found"))
}

fn put_circle(env: &Env, circle_id: u32, info: &CircleInfo) {
    env.storage().persistent().set(&circle_key(circle_id), info);
}

fn get_round_contributors(env: &Env, circle_id: u32) -> Vec<Address> {
    env.storage()
        .persistent()
        .get(&round_key(circle_id))
        .unwrap_or_else(|| Vec::new(env))
}

fn put_round_contributors(env: &Env, circle_id: u32, contributors: &Vec<Address>) {
    env.storage().persistent().set(&round_key(circle_id), contributors);
}

/// Deterministic pseudo-random shuffle for randomized payout order.
fn shuffle_order(env: &Env, members: &Vec<Address>, seed: u64) -> Vec<Address> {
    let n = members.len();
    let mut order = members.clone();
    if n <= 1 {
        return order;
    }
    let mut state = if seed == 0 { 1 } else { seed };
    let mut i: u32 = n - 1;
    loop {
        if i == 0 {
            break;
        }
        // xorshift64
        state ^= state << 13;
        state ^= state >> 7;
        state ^= state << 17;
        let j = (state % (i as u64 + 1)) as u32;
        let a = order.get(i).unwrap();
        let b = order.get(j).unwrap();
        order.set(i, b);
        order.set(j, a);
        i -= 1;
    }
    let _ = env;
    order
}

#[contract]
pub struct SavingsPool;

#[contractimpl]
impl PoolTrait for SavingsPool {
    fn initialize(env: Env, admin: Address, manager: Address, token: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&MANAGER, &manager);
        env.storage().instance().set(&TOKEN, &token);
        env.storage().instance().set(&CIRCLE_COUNT, &0u32);
    }

    fn create_circle(
        env: Env,
        creator: Address,
        name: String,
        size: u32,
        contribution_amount: i128,
        cycle_count: u32,
        is_random_order: bool,
    ) -> u32 {
        creator.require_auth();

        if size < 2 || size > 50 {
            panic!("size must be between 2 and 50");
        }
        if contribution_amount <= 0 {
            panic!("contribution amount must be positive");
        }
        if cycle_count == 0 {
            panic!("cycle count must be positive");
        }

        let count = read_count(&env);
        let circle_id = count + 1;

        let mut members: Vec<Address> = Vec::new(&env);
        members.push_back(creator.clone());

        let info = CircleInfo {
            config: CircleConfig {
                size,
                contribution_amount,
                cycle_count,
                is_random_order,
                creator: creator.clone(),
                name,
            },
            state: CircleState::Pending,
            members,
            current_round: 1,
            payout_order: Vec::new(&env),
            total_contributions: 0,
            pool_balance: 0,
        };

        put_circle(&env, circle_id, &info);
        env.storage().instance().set(&CIRCLE_COUNT, &circle_id);

        // New round contributors list is empty.
        put_round_contributors(&env, circle_id, &Vec::new(&env));

        env.events().publish(
            (symbol_short!("Created"), circle_id),
            (creator, size),
        );

        circle_id
    }

    fn join_circle(env: Env, member: Address, circle_id: u32) {
        member.require_auth();

        let mut info = get_circle(&env, circle_id);
        if info.state != CircleState::Pending {
            panic!("circle is not pending");
        }
        if info.members.len() >= info.config.size {
            panic!("circle is full");
        }
        if info.members.contains(&member) {
            panic!("already a member");
        }

        // Cross-contract eligibility check + registration.
        let manager = ManagerClient::new(&env, &read_manager(&env));
        if !manager.check_eligibility(&member, &circle_id) {
            panic!("not eligible: insufficient reputation");
        }
        manager.register_member(&member, &circle_id);

        info.members.push_back(member.clone());
        put_circle(&env, circle_id, &info);

        // If the circle is now full, activate it and compute payout order.
        let mut updated = get_circle(&env, circle_id);
        if updated.members.len() >= updated.config.size {
            let seed = (env.ledger().timestamp() as u64)
                ^ ((circle_id as u64) << 32)
                ^ (updated.config.size as u64);
            updated.payout_order = if updated.config.is_random_order {
                shuffle_order(&env, &updated.members, seed)
            } else {
                updated.members.clone()
            };
            updated.state = CircleState::Active;
            put_circle(&env, circle_id, &updated);

            env.events().publish(
                (symbol_short!("Activated"), circle_id),
                updated.config.size,
            );
        }

        env.events().publish(
            (symbol_short!("Joined"), circle_id),
            member,
        );
    }

    fn contribute(env: Env, member: Address, circle_id: u32, amount: i128) {
        member.require_auth();

        let mut info = get_circle(&env, circle_id);
        if info.state != CircleState::Active {
            panic!("circle is not active");
        }
        if !info.members.contains(&member) {
            panic!("not a member of this circle");
        }
        if amount != info.config.contribution_amount {
            panic!("amount must equal the contribution amount");
        }

        let mut contributors = get_round_contributors(&env, circle_id);
        if contributors.contains(&member) {
            panic!("already contributed this round");
        }

        // Escrow: transfer XLM from the member into this contract.
        let token = token::Client::new(&env, &read_token(&env));
        token.transfer(&member, &env.current_contract_address(), &amount);

        contributors.push_back(member.clone());
        put_round_contributors(&env, circle_id, &contributors);

        info.pool_balance += amount;
        info.total_contributions += amount;
        put_circle(&env, circle_id, &info);

        env.events().publish(
            (symbol_short!("Contrib"), circle_id),
            (member, amount, info.current_round),
        );
    }

    fn process_payout(env: Env, caller: Address, circle_id: u32) {
        caller.require_auth();

        let mut info = get_circle(&env, circle_id);
        if info.state != CircleState::Active {
            panic!("circle is not active");
        }

        let contributors = get_round_contributors(&env, circle_id);
        if contributors.len() < info.members.len() {
            panic!("round not complete");
        }

        // Determine the recipient for the current round.
        let order_len = info.payout_order.len();
        if order_len == 0 {
            panic!("payout order not set");
        }
        let idx = (info.current_round - 1) % order_len;
        let recipient = info.payout_order.get(idx).unwrap();

        // Release the entire pot.
        let amount = info.pool_balance;
        let token = token::Client::new(&env, &read_token(&env));
        token.transfer(&env.current_contract_address(), &recipient, &amount);

        info.pool_balance = 0;
        info.current_round += 1;
        if info.current_round > info.config.cycle_count {
            info.state = CircleState::Completed;
        }
        put_circle(&env, circle_id, &info);

        // Reset contributors for the next round (or clear on completion).
        put_round_contributors(&env, circle_id, &Vec::new(&env));

        env.events().publish(
            (symbol_short!("Payout"), circle_id),
            (recipient, amount, info.current_round),
        );
    }

    fn handle_default(env: Env, caller: Address, circle_id: u32, member: Address) {
        caller.require_auth();

        let info = get_circle(&env, circle_id);
        if info.state != CircleState::Active {
            panic!("circle is not active");
        }
        if !info.members.contains(&member) {
            panic!("not a member of this circle");
        }

        let contributors = get_round_contributors(&env, circle_id);
        if contributors.contains(&member) {
            panic!("member has already contributed");
        }

        // Cross-contract reputation penalty.
        let manager = ManagerClient::new(&env, &read_manager(&env));
        manager.update_reputation(&env.current_contract_address(), &member, &-30);

        env.events().publish(
            (symbol_short!("Default"), circle_id),
            member,
        );
    }

    fn get_circle_state(env: Env, circle_id: u32) -> CircleInfo {
        get_circle(&env, circle_id)
    }

    fn get_active_circles(env: Env) -> Vec<u32> {
        let count = read_count(&env);
        let mut active: Vec<u32> = Vec::new(&env);
        let mut i = 1u32;
        while i <= count {
            let info_opt: Option<CircleInfo> = env.storage().persistent().get(&circle_key(i));
            if let Some(info) = info_opt {
                if info.state == CircleState::Active {
                    active.push_back(i);
                }
            }
            i += 1;
        }
        active
    }

    fn get_circle_count(env: Env) -> u32 {
        read_count(&env)
    }
}
