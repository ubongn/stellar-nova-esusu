//! MemberManager contract — tracks members and reputation for Nova Esusu.
//!
//! Reputation is a simple additive score starting at 100. Completing rounds and
//! circles adds to it; defaulting subtracts. The SavingsPool contract is the
//! only address allowed to call `update_reputation` (set via `set_pool`).

#![no_std]

use shared::{ManagerTrait, Member, Reputation};
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Map, Vec};

const THRESHOLD: i32 = 40;

// Storage keys
const ADMIN: soroban_sdk::Symbol = symbol_short!("ADMIN");
const POOL: soroban_sdk::Symbol = symbol_short!("POOL");
const COUNT: soroban_sdk::Symbol = symbol_short!("COUNT");
const REPUTATION: soroban_sdk::Symbol = symbol_short!("REP");
const MEMBER: soroban_sdk::Symbol = symbol_short!("MEMBER");

fn reputations(env: &Env) -> Map<Address, Reputation> {
    env.storage()
        .persistent()
        .get(&REPUTATION)
        .unwrap_or_else(|| Map::new(env))
}

fn members(env: &Env) -> Map<Address, Member> {
    env.storage()
        .persistent()
        .get(&MEMBER)
        .unwrap_or_else(|| Map::new(env))
}

fn reputation_for(env: &Env, address: &Address) -> Reputation {
    reputations(env)
        .get(address.clone())
        .unwrap_or_else(|| Reputation {
            score: 100,
            circles_joined: 0,
            circles_completed: 0,
            defaults: 0,
            in_good_standing: true,
        })
}

fn require_admin(env: &Env) {
    let admin: Address = env
        .storage()
        .instance()
        .get(&ADMIN)
        .unwrap_or_else(|| panic!("not initialized"));
    admin.require_auth();
}

#[contract]
pub struct MemberManager;

#[contractimpl]
impl ManagerTrait for MemberManager {
    fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&COUNT, &0u32);
        // POOL is unset until set_pool is called by the admin.
    }

    fn set_pool(env: Env, admin: Address, pool: Address) {
        require_admin(&env);
        let _ = admin;
        env.storage().instance().set(&POOL, &pool);
    }

    fn register_member(env: Env, address: Address, circle_id: u32) {
        // If called on-chain by the joining user, auth is satisfied by them.
        // If called cross-contract by the pool, auth propagates through the
        // call stack. require_auth() records the needed authorization either way.
        address.require_auth();

        let mut reps = reputations(&env);
        let mut mems = members(&env);

        // Ensure reputation entry exists.
        if !reps.contains_key(address.clone()) {
            reps.set(
                address.clone(),
                Reputation {
                    score: 100,
                    circles_joined: 0,
                    circles_completed: 0,
                    defaults: 0,
                    in_good_standing: true,
                },
            );
        }

        // Ensure member entry exists; track circle membership.
        let is_new = !mems.contains_key(address.clone());
        let mut member = if is_new {
            Member {
                address: address.clone(),
                circle_ids: Vec::new(&env),
                is_active: true,
            }
        } else {
            mems.get(address.clone()).unwrap()
        };
        if !member.circle_ids.contains(&circle_id) {
            member.circle_ids.push_back(circle_id);
        }
        member.is_active = true;
        mems.set(address.clone(), member);

        // Increment circles_joined in reputation.
        let mut rep = reps.get(address.clone()).unwrap();
        rep.circles_joined += 1;
        reps.set(address.clone(), rep);

        env.storage().persistent().set(&REPUTATION, &reps);
        env.storage().persistent().set(&MEMBER, &mems);

        if is_new {
            let count: u32 = env.storage().instance().get(&COUNT).unwrap();
            env.storage().instance().set(&COUNT, &(count + 1));
        }

        env.events()
            .publish((symbol_short!("Reg"), address.clone()), circle_id);
    }

    fn track_reputation(env: Env, address: Address) -> Reputation {
        reputation_for(&env, &address)
    }

    fn invite_member(env: Env, existing: Address, new_member: Address) {
        existing.require_auth();

        let inviter_rep = reputation_for(&env, &existing);
        if !inviter_rep.in_good_standing {
            panic!("inviter not in good standing");
        }

        let mut mems = members(&env);
        let mut reps = reputations(&env);

        if !reps.contains_key(new_member.clone()) {
            reps.set(
                new_member.clone(),
                Reputation {
                    score: 100,
                    circles_joined: 0,
                    circles_completed: 0,
                    defaults: 0,
                    in_good_standing: true,
                },
            );
        }

        let is_new = !mems.contains_key(new_member.clone());
        if is_new {
            mems.set(
                new_member.clone(),
                Member {
                    address: new_member.clone(),
                    circle_ids: Vec::new(&env),
                    is_active: true,
                },
            );
            let count: u32 = env.storage().instance().get(&COUNT).unwrap();
            env.storage().instance().set(&COUNT, &(count + 1));
        }

        env.storage().persistent().set(&REPUTATION, &reps);
        env.storage().persistent().set(&MEMBER, &mems);

        env.events()
            .publish((symbol_short!("Invite"), existing), new_member);
    }

    fn check_eligibility(env: Env, address: Address, _circle_id: u32) -> bool {
        let rep = reputation_for(&env, &address);
        rep.score >= THRESHOLD
    }

    fn update_reputation(env: Env, caller: Address, address: Address, delta: i32) {
        // Only the authorized SavingsPool may call this.
        let pool: Option<Address> = env.storage().instance().get(&POOL);
        match pool {
            Some(p) => {
                if caller != p {
                    panic!("not authorized");
                }
            }
            None => panic!("pool not configured"),
        }

        let mut reps = reputations(&env);
        let mut rep = reputation_for(&env, &address);

        rep.score = (rep.score as i64 + delta as i64).clamp(0, 1000) as i32;
        rep.in_good_standing = rep.score >= THRESHOLD;
        if delta < 0 {
            rep.defaults += 1;
        }
        reps.set(address.clone(), rep.clone());
        env.storage().persistent().set(&REPUTATION, &reps);

        env.events()
            .publish((symbol_short!("Rep"), address.clone()), (delta, rep.score));
    }

    fn get_member_count(env: Env) -> u32 {
        env.storage().instance().get(&COUNT).unwrap_or(0)
    }
}
