pub mod config;
pub mod database;
pub mod models;
pub mod redis_client;

// Re-export commonly used types
pub use anyhow::Result;
pub use serde::{Deserialize, Serialize};

pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
