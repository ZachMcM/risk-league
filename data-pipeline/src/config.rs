use std::env;

pub fn get_env_required(key: &str) -> anyhow::Result<String> {
    env::var(key).map_err(|_| anyhow::anyhow!("Environment variable {} not set", key))
}
