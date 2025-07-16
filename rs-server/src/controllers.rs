use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::SqlitePool;
use time::OffsetDateTime;

use crate::utils::{create_jwt, hash_password, verify_password};

/* ---------------------------------- root ---------------------------------- */

// root handler
// ref: https://docs.rs/axum/0.8.4/axum/handler/index.html
pub async fn root() -> Json<serde_json::Value> {
    Json(json!({ "status": "works" }))
}

/* --------------------------------- signup --------------------------------- */

// TODO: validation
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

#[derive(Serialize)]
struct DbUser {
    id: i64,
    email: String,
    name: String,
    #[serde(skip_serializing)]
    password: String,
    #[serde(with = "time::serde::rfc3339")]
    created_at: OffsetDateTime,
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

    let unauthorized_response = || {
        (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "Incorrect email or password" })),
        )
    };

    if user.is_none() {
        return unauthorized_response();
    }

    let user = user.unwrap();

    if !verify_password(&input.password, &user.password) {
        return unauthorized_response();
    }

    let token = create_jwt(user.id);

    (
        StatusCode::OK,
        Json(json!({ "token": token, "user": user })),
    )
}
