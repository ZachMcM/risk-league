use anyhow::Result;
use redis::{AsyncCommands, Client};
use serde_json::Value;
use tokio::task;
use tracing::{error, info};

pub struct RedisClient {
    client: Client,
}

impl RedisClient {
    pub async fn new() -> Result<Self> {
        let redis_url = crate::config::get_env_required("REDIS_URL")?;
        let client = Client::open(redis_url)?;
        Ok(Self { client })
    }

    pub async fn publish(&self, channel: &str, message: &Value) -> Result<()> {
        let mut conn = self.client.get_multiplexed_async_connection().await?;
        let message_str = serde_json::to_string(message)?;
        let _: () = conn.publish(channel, message_str).await?; // Fix type annotation
        Ok(())
    }
}
