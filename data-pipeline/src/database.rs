use anyhow::Result;
use serde_json::Value;
use sqlx::{PgPool, Row};

pub async fn create_db_pool() -> Result<PgPool> {
    let database_url = crate::config::get_env_required("DATABASE_URL")?;
    let pool = PgPool::connect(&database_url).await?;
    Ok(pool)
}
