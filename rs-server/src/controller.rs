use axum::{
    Extension,
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use sqlx::SqlitePool;
use time::{OffsetDateTime, format_description};

use crate::utils::{create_jwt, hash_password, status_text, verify_password};

// TODO: request body validation
// TODO: error handling

/* ---------------------------------- root ---------------------------------- */

// root handler
// ref: https://docs.rs/axum/0.8.4/axum/handler/index.html
pub async fn root() -> Json<serde_json::Value> {
    Json(json!({ "status": "works" }))
}

/* --------------------------------- signup --------------------------------- */

#[derive(Deserialize)]
pub struct Signup {
    email: String,
    name: String,
    password: String,
}

// signup handler with json input
// ref: https://docs.rs/axum/0.8.4/axum/extract/index.html
pub async fn signup(
    State(pool): State<SqlitePool>,
    Json(input): Json<Signup>,
) -> (axum::http::StatusCode, axum::Json<serde_json::Value>) {
    let existing_user = sqlx::query!("SELECT id FROM user WHERE email = ?", input.email)
        .fetch_optional(&pool)
        .await
        .unwrap();
    if existing_user.is_some() {
        // TODO: vulnerable to enumeration attack
        // ref: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#authentication-responses
        // ref: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account
        return (
            StatusCode::CONFLICT,
            Json(json!({ "error": "User already exists" })),
        );
    }

    let hashed_password = hash_password(&input.password);

    sqlx::query!(
        "INSERT INTO user (email, name, password) VALUES (?, ?, ?)",
        input.email,
        input.name,
        hashed_password
    )
    .execute(&pool)
    .await
    .unwrap();

    (
        StatusCode::CREATED,
        Json(json!({ "message": "User created successfully" })),
    )
}

/* --------------------------------- login ---------------------------------- */

#[derive(Deserialize)]
pub struct Login {
    email: String,
    password: String,
}

#[derive(Serialize, Clone)]
pub struct DbUser {
    pub id: i64,
    pub email: String,
    pub name: String,
    #[serde(skip_serializing)]
    pub password: String,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
}

pub async fn login(
    State(pool): State<SqlitePool>,
    Json(input): Json<Login>,
) -> (axum::http::StatusCode, axum::Json<serde_json::Value>) {
    let user = sqlx::query_as!(
        DbUser,
        "select id, email, name, password, created_at from user where email = ?",
        input.email
    )
    .fetch_optional(&pool)
    .await
    .unwrap();

    let unauthorized_response = (
        StatusCode::UNAUTHORIZED,
        Json(json!({ "error": "Incorrect email or password" })),
    );

    if user.is_none() {
        return unauthorized_response;
    }

    let user = user.unwrap();

    if !verify_password(&input.password, &user.password) {
        return unauthorized_response;
    }

    let token = create_jwt(user.id);

    (
        StatusCode::OK,
        Json(json!({ "token": token, "user": user })),
    )
}

/* ------------------------------- put entry -------------------------------- */

#[derive(Deserialize)]
pub struct PutEntry {
    date: OffsetDateTime,
    text: Value,
}

pub async fn put_entry(
    State(pool): State<SqlitePool>,
    Extension(user): Extension<DbUser>,
    Json(input): Json<PutEntry>,
) -> Result<StatusCode, (StatusCode, &'static str)> {
    let existing_entry = sqlx::query!(
        "SELECT user_id FROM entry WHERE user_id = ? AND date = ?",
        user.id,
        input.date
    )
    .fetch_all(&pool)
    .await
    .map_err(|_| status_text(StatusCode::INTERNAL_SERVER_ERROR))?;

    if existing_entry.is_empty() {
        sqlx::query!(
            "INSERT INTO entry (user_id, date, text) VALUES (?, ?, ?)",
            user.id,
            input.date,
            input.text
        )
        .execute(&pool)
        .await
        .map_err(|_| status_text(StatusCode::INTERNAL_SERVER_ERROR))?;
    } else {
        sqlx::query!(
            "UPDATE entry SET text = ? WHERE user_id = ? AND date = ?",
            input.text,
            user.id,
            input.date
        )
        .execute(&pool)
        .await
        .map_err(|_| status_text(StatusCode::INTERNAL_SERVER_ERROR))?;
    }
    Ok(StatusCode::OK)
}

/* -------------------------- get all entry dates --------------------------- */

struct DbEntryDate {
    date: OffsetDateTime,
}

pub async fn get_all_entry_dates(
    State(pool): State<SqlitePool>,
    Extension(user): Extension<DbUser>,
) -> Result<Json<Vec<String>>, (StatusCode, &'static str)> {
    let dates = sqlx::query_as!(
        DbEntryDate,
        "select date from entry where user_id = ?",
        user.id
    )
    .fetch_all(&pool)
    .await
    .map_err(|_| status_text(StatusCode::INTERNAL_SERVER_ERROR))?;

    let format =
        format_description::parse("[year]-[month]-[day]").expect("Format string should be valid");

    let dates: Vec<String> = dates
        .into_iter()
        .map(|entry| entry.date.format(&format).expect("Failed to format date"))
        .collect();

    Ok(Json(dates))
}

/* --------------------------- get entry by date ---------------------------- */

#[derive(Serialize)]
pub struct DbEntry {
    user_id: i64,
    date: OffsetDateTime,
    text: Value,
    created_at: OffsetDateTime,
}

pub async fn get_entry_by_date(
    State(pool): State<SqlitePool>,
    Extension(user): Extension<DbUser>,
    Path(date): Path<String>,
) -> Result<Json<DbEntry>, (StatusCode, &'static str)> {
    let entry = sqlx::query_as!(
        DbEntry,
        // ref: https://docs.rs/sqlx/0.8.6/sqlx/macro.query_as.html#column-type-override-infer-from-struct-field
        r#"select user_id, date, text as "text: _", created_at from entry where user_id = ? and date = ?"#,
        user.id,
        date
    )
    .fetch_optional(&pool)
    .await
    .map_err(|_| status_text(StatusCode::INTERNAL_SERVER_ERROR))?
    .ok_or(status_text(StatusCode::NOT_FOUND))?;

    Ok(Json(entry))
}

/* -------------------------- delete entry by date -------------------------- */

pub async fn delete_entry_by_date(
    State(pool): State<SqlitePool>,
    Extension(user): Extension<DbUser>,
    Path(date): Path<String>,
) -> Result<StatusCode, (StatusCode, &'static str)> {
    sqlx::query!(
        "DELETE FROM entry WHERE user_id = ? AND date = ?",
        user.id,
        date
    )
    .execute(&pool)
    .await
    .map_err(|_| status_text(StatusCode::INTERNAL_SERVER_ERROR))?;

    Ok(StatusCode::NO_CONTENT)
}
