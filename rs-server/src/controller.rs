use crate::{
    db::{self, DbEntry, DbUser},
    utils::{
        create_jwt, deserialize_date_from_string, get_date_from_string, hash_password,
        offset_date_time_to_yyyy_mm_dd, verify_password,
    },
};
use axum::{
    Extension,
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::Deserialize;
use serde_json::{Value, json};
use sqlx::SqlitePool;
use time::OffsetDateTime;

// TODO: request body validation
// TODO: error handling

/* ---------------------------------- root ---------------------------------- */

// root handler
// ref: https://docs.rs/axum/0.8.4/axum/handler/index.html
pub async fn root() -> Json<Value> {
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
) -> Result<StatusCode, StatusCode> {
    db::get_user_id_by_email(&pool, &input.email)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        // TODO: vulnerable to enumeration attack
        // ref: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#authentication-responses
        // ref: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account
        .ok_or(StatusCode::CONFLICT)?;

    let hashed_password = hash_password(&input.password).map_err(|_| StatusCode::BAD_REQUEST)?;

    db::create_user(&pool, &input.email, &input.name, &hashed_password)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::CREATED)
}

/* --------------------------------- login ---------------------------------- */

#[derive(Deserialize)]
pub struct Login {
    email: String,
    password: String,
}

pub async fn login(
    State(pool): State<SqlitePool>,
    Json(input): Json<Login>,
) -> Result<Json<Value>, StatusCode> {
    let user = db::get_user_by_email(&pool, &input.email)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !verify_password(&input.password, &user.password) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = create_jwt(user.id).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({ "token": token, "user": user })))
}

/* ------------------------------- put entry -------------------------------- */

#[derive(Deserialize)]
pub struct PutEntry {
    #[serde(deserialize_with = "deserialize_date_from_string")]
    date: OffsetDateTime,
    text: Value,
}

pub async fn put_entry(
    State(pool): State<SqlitePool>,
    Extension(user): Extension<DbUser>,
    Json(input): Json<PutEntry>,
) -> Result<StatusCode, StatusCode> {
    let existing_entry = db::check_entry_exists_by_user_and_date(&pool, user.id, input.date)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if existing_entry.is_none() {
        db::create_entry(&pool, user.id, input.date, input.text)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    } else {
        db::update_entry_text_by_user_and_date(&pool, input.text, user.id, input.date)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }
    Ok(StatusCode::OK)
}

/* -------------------------- get all entry dates --------------------------- */

pub async fn get_all_entry_dates(
    State(pool): State<SqlitePool>,
    Extension(user): Extension<DbUser>,
) -> Result<Json<Vec<String>>, StatusCode> {
    let dates: Result<Vec<String>, _> = db::list_entry_dates_by_user(&pool, user.id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .iter()
        .map(|date| offset_date_time_to_yyyy_mm_dd(*date))
        .collect();
    let dates = dates.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(dates))
}

/* --------------------------- get entry by date ---------------------------- */

pub async fn get_entry_by_date(
    State(pool): State<SqlitePool>,
    Extension(user): Extension<DbUser>,
    Path(date): Path<String>,
) -> Result<Json<DbEntry>, StatusCode> {
    let date = get_date_from_string(&date).map_err(|_| StatusCode::BAD_REQUEST)?;
    let entry = db::get_entry_by_user_and_date(&pool, user.id, date)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(entry))
}

/* -------------------------- delete entry by date -------------------------- */

pub async fn delete_entry_by_date(
    State(pool): State<SqlitePool>,
    Extension(user): Extension<DbUser>,
    Path(date): Path<String>,
) -> Result<StatusCode, StatusCode> {
    let date = get_date_from_string(&date).map_err(|_| StatusCode::BAD_REQUEST)?;
    db::delete_entry_by_user_and_date(&pool, user.id, date)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::NO_CONTENT)
}
