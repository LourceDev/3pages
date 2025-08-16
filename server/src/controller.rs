use crate::{
    datetime::AppDateTime,
    db::{self, DbEntry, DbUser},
    extractor::ValidatedJson,
    tiptap::TiptapJsonContent,
    utils,
};
use axum::{
    Extension,
    extract::{Json, Path, State},
    http::StatusCode,
};
use serde::Deserialize;
use serde_json::{Value, json};
use sqlx::SqlitePool;
use validator::Validate;

/* ---------------------------------- root ---------------------------------- */

// root handler
// ref: https://docs.rs/axum/0.8.4/axum/handler/index.html
pub async fn root() -> Json<Value> {
    Json(json!({ "status": "works" }))
}

/* --------------------------------- signup --------------------------------- */

#[derive(Validate, Deserialize)]
pub struct SignupInput {
    #[validate(email(message = "Invalid email"))]
    #[serde(with = "crate::utils::trimmed_string")]
    email: String,
    #[serde(with = "crate::utils::trimmed_string")]
    name: String,
    #[validate(length(
        min = 8,
        max = 40,
        message = "Password must be between 8 and 40 characters long"
    ))]
    password: String,
}

// signup handler with json input
// ref: https://docs.rs/axum/0.8.4/axum/extract/index.html
pub async fn signup(
    State(pool): State<SqlitePool>,
    ValidatedJson(input): ValidatedJson<SignupInput>,
) -> Result<StatusCode, StatusCode> {
    let user_id = db::get_user_id_by_email(&pool, &input.email)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if user_id.is_some() {
        // TODO: vulnerable to enumeration attack
        // ref: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#authentication-responses
        // ref: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account
        return Err(StatusCode::CONFLICT);
    }

    let hashed_password =
        utils::hash_password(&input.password).map_err(|_| StatusCode::BAD_REQUEST)?;

    db::create_user(&pool, &input.email, &input.name, &hashed_password)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::CREATED)
}

/* --------------------------------- login ---------------------------------- */

#[derive(Validate, Deserialize)]
pub struct LoginInput {
    #[validate(email(message = "Invalid email"))]
    #[serde(with = "crate::utils::trimmed_string")]
    email: String,
    #[validate(length(
        min = 8,
        max = 40,
        message = "Password must be between 8 and 40 characters long"
    ))]
    password: String,
}

pub async fn login(
    State(pool): State<SqlitePool>,
    Json(input): Json<LoginInput>,
) -> Result<Json<Value>, StatusCode> {
    let user = db::get_user_by_email(&pool, &input.email)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !utils::verify_password(&input.password, &user.password) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = utils::create_jwt(user.id).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(json!({ "token": token, "user": user })))
}

/* ------------------------------- put entry -------------------------------- */

#[derive(Deserialize, Debug)]
pub struct PutEntryInput {
    text: TiptapJsonContent,
}

pub async fn put_entry(
    State(pool): State<SqlitePool>,
    Extension(user): Extension<DbUser>,
    Path(date): Path<String>,
    Json(input): Json<PutEntryInput>,
) -> Result<StatusCode, StatusCode> {
    let date = AppDateTime::from_iso_string(&date).map_err(|_| StatusCode::BAD_REQUEST)?;
    let existing_entry = db::check_entry_exists_by_user_and_date(&pool, user.id, date.into())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let word_count = input.text.count_words();
    let text_json = serde_json::to_value(&input.text).map_err(|_| StatusCode::BAD_REQUEST)?;

    if existing_entry.is_none() {
        db::create_entry(&pool, user.id, date.into(), text_json, word_count)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    } else {
        db::update_entry_text_by_user_and_date(&pool, text_json, word_count, user.id, date.into())
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
        .map(|date| date.to_yyyy_mm_dd_string())
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
    let date = AppDateTime::from_iso_string(&date).map_err(|_| StatusCode::BAD_REQUEST)?;
    let entry = db::get_entry_by_user_and_date(&pool, user.id, date.into())
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
    let date = AppDateTime::from_iso_string(&date).map_err(|_| StatusCode::BAD_REQUEST)?;
    db::delete_entry_by_user_and_date(&pool, user.id, date.into())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::NO_CONTENT)
}
