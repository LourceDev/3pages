// naming convention: [Action]_[Entity]_[By_Clause]

use crate::datetime::AppDateTime;
use serde::Serialize;
use serde_json::Value;
use sqlx::{Error, SqlitePool, query_file, query_file_as};
use time::OffsetDateTime;

pub async fn get_user_id_by_email(pool: &SqlitePool, email: &str) -> Result<Option<i64>, Error> {
    let record = query_file!("src/sql/get_user_id_by_email.sql", email)
        .fetch_optional(pool)
        .await?;
    Ok(record.map(|r| r.id))
}

pub async fn create_user(
    pool: &SqlitePool,
    email: &str,
    name: &str,
    password: &str,
) -> Result<(), Error> {
    query_file!("src/sql/create_user.sql", email, name, password)
        .execute(pool)
        .await?;
    Ok(())
}

#[derive(Serialize, Clone)]
pub struct DbUser {
    pub id: i64,
    pub email: String,
    pub name: String,
    #[serde(skip_serializing)]
    pub password: String,
    #[serde(rename = "createdAt")]
    pub created_at: AppDateTime,
}

pub async fn get_user_by_email(pool: &SqlitePool, email: &str) -> Result<Option<DbUser>, Error> {
    query_file_as!(DbUser, "src/sql/get_user_by_email.sql", email)
        .fetch_optional(pool)
        .await
}

pub async fn check_entry_exists_by_user_and_date(
    pool: &SqlitePool,
    user_id: i64,
    date: OffsetDateTime,
) -> Result<Option<i64>, Error> {
    let record = query_file!(
        "src/sql/check_entry_exists_by_user_and_date.sql",
        user_id,
        date
    )
    .fetch_optional(pool)
    .await?;
    Ok(record.map(|r| r.user_id))
}

pub async fn create_entry(
    pool: &SqlitePool,
    user_id: i64,
    date: OffsetDateTime,
    text: Value,
    word_count: i64
) -> Result<(), Error> {
    query_file!("src/sql/create_entry.sql", user_id, date, text, word_count)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_entry_text_by_user_and_date(
    pool: &SqlitePool,
    text: Value,
    word_count: i64,
    user_id: i64,
    date: OffsetDateTime,
) -> Result<(), Error> {
    query_file!(
        "src/sql/update_entry_text_by_user_and_date.sql",
        text,
        word_count,
        user_id,
        date
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn list_entry_dates_by_user(
    pool: &SqlitePool,
    user_id: i64,
) -> Result<Vec<AppDateTime>, Error> {
    query_file!("src/sql/list_entry_dates_by_user.sql", user_id)
        .fetch_all(pool)
        .await
        .map(|records| records.iter().map(|record| record.date.into()).collect())
}

#[derive(Serialize)]
pub struct DbEntry {
    #[serde(rename = "userId")]
    user_id: i64,
    #[serde(serialize_with = "crate::datetime::AppDateTime::serialize_to_yyyy_mm_dd_string")]
    date: AppDateTime,
    text: Value,
    word_count: i64,
    #[serde(rename = "createdAt")]
    created_at: AppDateTime,
}

pub async fn get_entry_by_user_and_date(
    pool: &SqlitePool,
    user_id: i64,
    date: OffsetDateTime,
) -> Result<Option<DbEntry>, Error> {
    query_file_as!(
        DbEntry,
        "src/sql/get_entry_by_user_and_date.sql",
        user_id,
        date
    )
    .fetch_optional(pool)
    .await
}

pub async fn delete_entry_by_user_and_date(
    pool: &SqlitePool,
    user_id: i64,
    date: OffsetDateTime,
) -> Result<(), Error> {
    query_file!("src/sql/delete_entry_by_user_and_date.sql", user_id, date)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn get_user_by_id(pool: &SqlitePool, id: i64) -> Result<Option<DbUser>, Error> {
    query_file_as!(DbUser, "src/sql/get_user_by_id.sql", id)
        .fetch_optional(pool)
        .await
}
