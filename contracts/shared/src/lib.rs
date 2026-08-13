//! Shared types and client traits for the Nova Esusu platform.
//!
//! This crate breaks the circular dependency between the two contracts:
//! `savings_pool` and `member_manager` each only need the *other's* client
//! trait, which lives here.

#![no_std]
#![allow(dead_code)]

use soroban_sdk::{contractclient, contracterror, contracttype, Address, String, Vec};

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/// Configuration of a savings circle, set at creation time and immutable.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CircleConfig {
    /// Number of members required to fill the circle.
    pub size: u32,
    /// Amount each member contributes per round, in stroops (1 XLM = 10^7).
    pub contribution_amount: i128,
    /// Total number of payout rounds the circle runs.
    pub cycle_count: u32,
    /// If true the payout order is randomized, otherwise it is join-order.
    pub is_random_order: bool,
    /// The address that created the circle.
    pub creator: Address,
    /// Human-readable name for display.
    pub name: String,
}

/// Lifecycle of a circle.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CircleState {
    /// Not enough members yet.
    Pending,
    /// Active and accepting contributions.
    Active,
    /// All rounds completed.
    Completed,
    /// Closed by creator before activation (soft-deleted).
    Closed,
}

/// Full snapshot of a circle, returned by `get_circle_state`.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CircleInfo {
    pub config: CircleConfig,
    pub state: CircleState,
    pub members: Vec<Address>,
    /// 1-indexed: the round currently collecting contributions.
    pub current_round: u32,
    /// Ordered list of recipients, one per round.
    pub payout_order: Vec<Address>,
    /// Sum of all contributions ever made to this circle (stroops).
    pub total_contributions: i128,
    /// XLM currently held in escrow for this circle (stroops).
    pub pool_balance: i128,
}

/// Reputation record for a member.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Reputation {
    /// Reputation score. Starts at 100, can go up or down.
    pub score: i32,
    /// Number of circles joined.
    pub circles_joined: u32,
    /// Number of circles fully completed.
    pub circles_completed: u32,
    /// Number of defaults recorded.
    pub defaults: u32,
    /// Whether the member is in good standing (score >= threshold).
    pub in_good_standing: bool,
}

/// A single contribution record.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Contribution {
    pub member: Address,
    pub amount: i128,
    pub round: u32,
    pub circle_id: u32,
}

/// Member registration record.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Member {
    pub address: Address,
    pub circle_ids: Vec<u32>,
    pub is_active: bool,
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    CircleNotFound = 4,
    CircleFull = 5,
    CircleNotActive = 6,
    NotAMember = 7,
    AlreadyContributed = 8,
    RoundNotComplete = 9,
    InvalidAmount = 10,
    InvalidSize = 11,
    InsufficientReputation = 12,
    MemberAlreadyRegistered = 13,
    MemberNotFound = 14,
    AllRoundsComplete = 15,
    InvalidInput = 16,
    AlreadyJoined = 17,
    InviteNotAuthorized = 18,
}

// ---------------------------------------------------------------------------
// Client traits (generated clients let contracts call each other)
// ---------------------------------------------------------------------------

/// Public interface of the SavingsPool contract.
#[contractclient(name = "PoolClient")]
pub trait PoolTrait {
    /// One-time initialization.
    fn initialize(env: soroban_sdk::Env, admin: Address, manager: Address, token: Address);

    /// Create a new circle. Returns the new circle id.
    fn create_circle(
        env: soroban_sdk::Env,
        creator: Address,
        name: String,
        size: u32,
        contribution_amount: i128,
        cycle_count: u32,
        is_random_order: bool,
    ) -> u32;

    /// Join a pending circle. Cross-calls MemberManager for eligibility.
    fn join_circle(env: soroban_sdk::Env, member: Address, circle_id: u32);

    /// Contribute `amount` toward the current round of a circle.
    fn contribute(env: soroban_sdk::Env, member: Address, circle_id: u32, amount: i128);

    /// Send the current round pot to the recipient and advance the rotation.
    fn process_payout(env: soroban_sdk::Env, caller: Address, circle_id: u32);

    /// Close a pending circle (creator only, no contributions yet).
    fn close_circle(env: soroban_sdk::Env, caller: Address, circle_id: u32);

    /// Skip a defaulting member and penalize their reputation.
    fn handle_default(
        env: soroban_sdk::Env,
        caller: Address,
        circle_id: u32,
        member: Address,
    );

    /// Full snapshot of a circle.
    fn get_circle_state(env: soroban_sdk::Env, circle_id: u32) -> CircleInfo;

    /// All active circle ids.
    fn get_active_circles(env: soroban_sdk::Env) -> Vec<u32>;

    /// Total number of circles ever created.
    fn get_circle_count(env: soroban_sdk::Env) -> u32;
}

/// Public interface of the MemberManager contract.
#[contractclient(name = "ManagerClient")]
pub trait ManagerTrait {
    /// One-time initialization.
    fn initialize(env: soroban_sdk::Env, admin: Address);

    /// Authorize the SavingsPool contract to update reputation.
    fn set_pool(env: soroban_sdk::Env, admin: Address, pool: Address);

    /// Register a member into a circle.
    fn register_member(env: soroban_sdk::Env, address: Address, circle_id: u32);

    /// Return a member's reputation record.
    fn track_reputation(env: soroban_sdk::Env, address: Address) -> Reputation;

    /// Invite a new member (existing must be in good standing).
    fn invite_member(env: soroban_sdk::Env, existing: Address, new_member: Address);

    /// Whether `address` may join `circle_id`.
    fn check_eligibility(env: soroban_sdk::Env, address: Address, circle_id: u32) -> bool;

    /// Adjust a member's reputation. Only the authorized pool may call.
    fn update_reputation(
        env: soroban_sdk::Env,
        caller: Address,
        address: Address,
        delta: i32,
    );

    /// Total registered members.
    fn get_member_count(env: soroban_sdk::Env) -> u32;
}
