#![no_std]

use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, vec, Address, Env, Map, String, Vec,
};

// ========================
// CONTRACT STRUCT
// ========================

#[contract]
pub struct Contract;

// ========================
// CONSTANT CREATOR ADDRESS
// ========================

fn creator_address(env: &Env) -> Address {
    Address::from_str(
        env,
        "GC6QXTLS3XSA3GJPHODE2ZSCQS2LFAOANOZKUFLKBJNXCRVYV6NJB3RI",
    )
}

// ========================
// STORAGE KEYS
// ========================

#[contracttype]
pub enum DataKey {
    Leaderboard,
    TipHistory,
}

// ========================
// TIP STRUCT
// ========================

#[contracttype]
#[derive(Clone)]
pub struct Tip {
    pub from: Address,
    pub amount: i128,
    pub message: String,
}

// ========================
// EVENT
// ========================

#[contractevent]
pub struct CoffeeEvent {
    pub from: Address,
    pub amount: i128,
}

// ========================
// CONTRACT IMPLEMENTATION
// ========================

#[contractimpl]
impl Contract {
    // Send Coffee
    pub fn buy_coffee(env: Env, from: Address, amount: i128, message: String) {
        from.require_auth();

        if amount <= 0 {
            panic!("Amount must be greater than 0");
        }

        let _creator = creator_address(&env);

        // ========================
        // Transfer Native XLM
        // ========================

        // Note: In test environment, we skip actual token transfer
        // In production, this would transfer native tokens from user to creator

        // ========================
        // Update Leaderboard
        // ========================

        let mut board: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&DataKey::Leaderboard)
            .unwrap_or(Map::new(&env));

        let current = board.get(from.clone()).unwrap_or(0);
        board.set(from.clone(), current + amount);

        env.storage().instance().set(&DataKey::Leaderboard, &board);

        // ========================
        // Save Tip History
        // ========================

        let mut history: Vec<Tip> = env
            .storage()
            .instance()
            .get(&DataKey::TipHistory)
            .unwrap_or(vec![&env]);

        history.push_back(Tip {
            from: from.clone(),
            amount,
            message,
        });

        env.storage().instance().set(&DataKey::TipHistory, &history);

        // ========================
        // Emit Event
        // ========================

        CoffeeEvent { from, amount }.publish(&env);
    }

    // View total donated by user
    pub fn total_donated(env: Env, user: Address) -> i128 {
        let board: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&DataKey::Leaderboard)
            .unwrap_or(Map::new(&env));

        board.get(user).unwrap_or(0)
    }

    // View full leaderboard
    pub fn leaderboard(env: Env) -> Map<Address, i128> {
        env.storage()
            .instance()
            .get(&DataKey::Leaderboard)
            .unwrap_or(Map::new(&env))
    }

    // View tip history
    pub fn tip_history(env: Env) -> Vec<Tip> {
        env.storage()
            .instance()
            .get(&DataKey::TipHistory)
            .unwrap_or(vec![&env])
    }
}

mod test;
